// Recebe Real-time Developer Notifications do Google Play via Pub/Sub push.
// Atualiza public.play_subscriptions quando a assinatura renova, cancela, entra em graça, etc.
import { createClient } from 'npm:@supabase/supabase-js@2';

const PACKAGE_NAME = Deno.env.get('ANDROID_PACKAGE_NAME') ?? '';
const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON') ?? '';
const PUBSUB_TOKEN = Deno.env.get('GOOGLE_PLAY_PUBSUB_VERIFICATION_TOKEN') ?? '';

type SubscriptionStatus =
  | 'SUBSCRIPTION_STATE_UNSPECIFIED'
  | 'SUBSCRIPTION_STATE_PENDING'
  | 'SUBSCRIPTION_STATE_ACTIVE'
  | 'SUBSCRIPTION_STATE_PAUSED'
  | 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
  | 'SUBSCRIPTION_STATE_ON_HOLD'
  | 'SUBSCRIPTION_STATE_CANCELED'
  | 'SUBSCRIPTION_STATE_EXPIRED';

function mapStatus(gJson: any): SubscriptionStatus {
  const expiryMs = Number(gJson.expiryTimeMillis ?? 0);
  const nowMs = Date.now();
  if (gJson.cancelReason != null && expiryMs < nowMs) return 'SUBSCRIPTION_STATE_CANCELED';
  if (expiryMs < nowMs) return 'SUBSCRIPTION_STATE_EXPIRED';
  return 'SUBSCRIPTION_STATE_ACTIVE';
}

// Cache do access token dentro do isolate (evita OAuth handshake em cada evento)
let tokenCache: { token: string; exp: number } | null = null;

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache && tokenCache.exp - 60 > now) return tokenCache.token;
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, iat: now,
  };
  const b64url = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const enc = new TextEncoder();
  const toSign = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(toSign)));
  const jwt = `${toSign}.${b64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`Google OAuth failed: ${JSON.stringify(json)}`);
  tokenCache = { token: json.access_token, exp: now + 3500 };
  return json.access_token;
}


Deno.serve(async (req) => {
  try {
    // Valida token de verificação do Pub/Sub push
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    if (!PUBSUB_TOKEN || token !== PUBSUB_TOKEN) {
      return new Response('unauthorized', { status: 401 });
    }

    const body = await req.json();
    // Pub/Sub push envelope: { message: { data: <base64> } }
    const b64: string | undefined = body?.message?.data;
    if (!b64) return new Response('no data', { status: 200 });
    const decoded = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
    const sub = decoded.subscriptionNotification;
    if (!sub) return new Response('ignored', { status: 200 });

    const { subscriptionId: productId, purchaseToken, notificationType } = sub;
    const accessToken = await getGoogleAccessToken();
    const googleUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(PACKAGE_NAME)}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const gRes = await fetch(googleUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const gJson = await gRes.json();
    if (!gRes.ok) {
      console.error('Google API error', gRes.status, gJson);
      return new Response('ok', { status: 200 });
    }

    const status = mapStatus(gJson);
    const expiryMs = Number(gJson.expiryTimeMillis ?? 0);

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Se a linha ainda não existe (RTDN chegou antes do validate-purchase do app),
    // tenta resolver o user_id via developerPayload que enviamos no ack.
    const developerUserId =
      (typeof gJson.developerPayload === 'string' && gJson.developerPayload) ||
      gJson.obfuscatedExternalAccountId ||
      null;

    const patch: Record<string, unknown> = {
      user_id: developerUserId ?? undefined,
      product_id: productId,
      purchase_token: purchaseToken,
      order_id: gJson.orderId ?? null,
      status,
      auto_renewing: !!gJson.autoRenewing,
      start_time: gJson.startTimeMillis ? new Date(Number(gJson.startTimeMillis)).toISOString() : null,
      expires_at: expiryMs ? new Date(expiryMs).toISOString() : null,
      cancel_reason: gJson.cancelReason != null ? String(gJson.cancelReason) : null,
      latest_notification_type: notificationType ?? null,
      latest_notification_at: new Date().toISOString(),
      raw_payload: gJson,
    };
    // Remove chaves undefined (evita sobrescrever com null quando não sabemos)
    Object.keys(patch).forEach(k => patch[k] === undefined && delete patch[k]);

    const { error: upErr } = await admin
      .from('play_subscriptions')
      .upsert(patch, { onConflict: 'purchase_token' });
    if (upErr) console.error('upsert play_subscriptions falhou', upErr);

    return new Response('ok', { status: 200 });
  } catch (err) {
    console.error('play-billing-webhook error', err);
    return new Response('error', { status: 200 }); // 200 para Pub/Sub não reenviar em loop
  }
});
