// Consulta o Google Play Developer Reporting API + agrega dados locais de assinaturas.
// Reaproveita GOOGLE_PLAY_SERVICE_ACCOUNT_JSON já configurado no projeto.
// Requer que a service account tenha no Play Console permissão "Ver app information e estatísticas"
// e "Ver informações financeiras, pedidos e cancelamentos".
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PACKAGE_NAME = Deno.env.get('ANDROID_PACKAGE_NAME') ?? '';
const SERVICE_ACCOUNT_JSON = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON') ?? '';

// Cache em memória (edge function warm) — 5 min
let tokenCache: { token: string; exp: number } | null = null;
const metricsCache = new Map<string, { at: number; data: unknown }>();
const CACHE_MS = 5 * 60 * 1000;

async function getGoogleAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.exp > Date.now() + 60_000) return tokenCache.token;
  const sa = JSON.parse(SERVICE_ACCOUNT_JSON);
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: sa.client_email,
    scope: [
      'https://www.googleapis.com/auth/androidpublisher',
      'https://www.googleapis.com/auth/playdeveloperreporting',
    ].join(' '),
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const b64url = (b: Uint8Array) =>
    btoa(String.fromCharCode(...b)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const enc = new TextEncoder();
  const toSign = `${b64url(enc.encode(JSON.stringify(header)))}.${b64url(enc.encode(JSON.stringify(claim)))}`;
  const pem = sa.private_key.replace(/-----(BEGIN|END) PRIVATE KEY-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    'pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(toSign)));
  const jwt = `${toSign}.${b64url(sig)}`;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error('oauth: ' + JSON.stringify(json));
  tokenCache = { token: json.access_token, exp: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return tokenCache.token;
}

function dateOnly(d: Date) {
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

async function queryMetricSet(
  accessToken: string,
  metricSet: 'subscriptionMetricSet' | 'installsMetricSet',
  metrics: string[],
  dimensions: string[],
  days: number,
) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  const url =
    `https://playdeveloperreporting.googleapis.com/v1beta1/apps/${encodeURIComponent(PACKAGE_NAME)}/${metricSet}:query`;
  const body = {
    timelineSpec: {
      aggregationPeriod: 'DAILY',
      startTime: { ...dateOnly(start), timeZone: { id: 'UTC' } },
      endTime: { ...dateOnly(end), timeZone: { id: 'UTC' } },
    },
    dimensions,
    metrics,
  };
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { ok: res.ok, status: res.status, body: json };
}

async function fetchReporting() {
  const cacheKey = 'all';
  const hit = metricsCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
  const token = await getGoogleAccessToken();

  // Subscription metrics — 30 dias
  const subs = await queryMetricSet(
    token,
    'subscriptionMetricSet',
    ['activeSubscribersCount', 'newSubscribersCount', 'canceledSubscribersCount', 'subscriptionRenewalsCount'],
    ['basePlanId'],
    30,
  );
  // Installs — 30 dias
  const installs = await queryMetricSet(
    token,
    'installsMetricSet',
    ['activeDeviceInstalls'],
    [],
    30,
  );

  const data = { subs, installs, generatedAt: new Date().toISOString() };
  metricsCache.set(cacheKey, { at: Date.now(), data });
  return data;
}

async function fetchSubscribersLocal(supabase: ReturnType<typeof createClient>) {
  const { data: rows, error } = await supabase
    .from('play_subscriptions')
    .select('user_id, product_id, base_plan_id, purchase_token, order_id, status, auto_renewing, start_time, expires_at, cancel_reason, updated_at')
    .order('start_time', { ascending: false, nullsFirst: false })
    .limit(500);
  if (error) throw error;

  const userIds = [...new Set((rows ?? []).map((r) => r.user_id).filter(Boolean))];
  const profilesMap = new Map<string, { display_name?: string; avatar_url?: string }>();
  const emailsMap = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .in('id', userIds);
    (profiles ?? []).forEach((p: any) => profilesMap.set(p.id, p));

    // Emails via admin API — paginado
    let page = 1;
    while (page < 20) {
      const { data: users, error: uErr } = await (supabase as any).auth.admin.listUsers({ page, perPage: 200 });
      if (uErr || !users?.users?.length) break;
      users.users.forEach((u: any) => { if (u.email) emailsMap.set(u.id, u.email); });
      if (users.users.length < 200) break;
      page++;
    }
  }

  const enriched = (rows ?? []).map((r) => {
    const p = profilesMap.get(r.user_id) ?? {};
    const startMs = r.start_time ? new Date(r.start_time).getTime() : 0;
    const expMs = r.expires_at ? new Date(r.expires_at).getTime() : 0;
    const durationMs = startMs && expMs ? expMs - startMs : 0;
    const isTest = durationMs > 0 && durationMs < 60 * 60 * 1000; // < 1h = teste de licença
    return {
      ...r,
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      email: emailsMap.get(r.user_id) ?? null,
      is_test: isTest,
    };
  });

  // Agregados locais
  const now = Date.now();
  const active = enriched.filter((r) =>
    (r.status === 'SUBSCRIPTION_STATE_ACTIVE' || r.status === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') &&
    (!r.expires_at || new Date(r.expires_at).getTime() > now)
  );
  const testCount = enriched.filter((r) => r.is_test).length;
  const byPlan: Record<string, number> = {};
  active.forEach((r) => { const k = r.product_id ?? 'desconhecido'; byPlan[k] = (byPlan[k] ?? 0) + 1; });

  return {
    rows: enriched,
    stats: {
      total: enriched.length,
      active: active.length,
      test: testCount,
      byPlan,
    },
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Auth: precisa ser admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: cErr } = await anon.auth.getClaims(authHeader.replace('Bearer ', ''));
    if (cErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: isAdmin } = await admin.rpc('is_admin_user', { _user_id: claims.claims.sub });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!SERVICE_ACCOUNT_JSON || !PACKAGE_NAME) {
      return new Response(JSON.stringify({ error: 'Configuração ausente: GOOGLE_PLAY_SERVICE_ACCOUNT_JSON / ANDROID_PACKAGE_NAME' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const [reporting, local] = await Promise.all([
      fetchReporting().catch((err) => ({ error: String(err?.message ?? err) })),
      fetchSubscribersLocal(admin),
    ]);

    // Extrai e-mail da service account (para mensagem de erro 403 amigável)
    let serviceAccountEmail: string | null = null;
    try { serviceAccountEmail = JSON.parse(SERVICE_ACCOUNT_JSON).client_email ?? null; } catch { /* ignore */ }

    return new Response(JSON.stringify({
      reporting,
      local,
      packageName: PACKAGE_NAME,
      serviceAccountEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('play-reporting error', err);
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});