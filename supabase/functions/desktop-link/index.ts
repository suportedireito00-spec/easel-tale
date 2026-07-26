// Endpoint único do fluxo de login por QR-code no desktop.
// action=create → gera token pendente (público)
// action=poll   → desktop consulta status; devolve otp_hash uma única vez (público)
// action=claim  → celular autenticado vincula seu usuário ao token (Bearer JWT)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || '').trim();

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (action === 'create') {
      // Limpeza oportunista de tokens vencidos.
      await admin.from('desktop_link_tokens').delete().lt('expires_at', new Date().toISOString());

      const { data, error } = await admin
        .from('desktop_link_tokens')
        .insert({})
        .select('token, expires_at')
        .single();
      if (error) throw error;
      return json({ token: data.token, expires_at: data.expires_at });
    }

    const token = String(body?.token || '').trim();
    if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: 'invalid_token' }, 400);

    if (action === 'poll') {
      const { data: row, error } = await admin
        .from('desktop_link_tokens')
        .select('status, otp_hash, email, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (error) throw error;
      if (!row) return json({ status: 'not_found' }, 404);

      if (row.status === 'pending') {
        if (new Date(row.expires_at).getTime() < Date.now()) {
          await admin.from('desktop_link_tokens').delete().eq('token', token);
          return json({ status: 'expired' });
        }
        return json({ status: 'pending' });
      }
      if (row.status === 'claimed' && row.otp_hash) {
        // Devolve o otp_hash apenas uma vez e marca consumed.
        const { data: updated } = await admin
          .from('desktop_link_tokens')
          .update({ status: 'consumed' })
          .eq('token', token)
          .eq('status', 'claimed')
          .select('otp_hash, email')
          .maybeSingle();
        if (!updated) return json({ status: 'consumed' });
        return json({ status: 'claimed', token_hash: updated.otp_hash, email: updated.email });
      }
      return json({ status: row.status });
    }

    if (action === 'claim') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return json({ error: 'missing_auth' }, 401);

      const supabaseUser = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? '',
        { global: { headers: { Authorization: authHeader } } },
      );
      const { data: userData, error: authError } = await supabaseUser.auth.getUser();
      if (authError || !userData?.user?.email) return json({ error: 'invalid_session' }, 401);
      const user = userData.user;

      const { data: row } = await admin
        .from('desktop_link_tokens')
        .select('token, status, expires_at')
        .eq('token', token)
        .maybeSingle();
      if (!row) return json({ error: 'token_not_found' }, 404);
      if (row.status !== 'pending') return json({ error: 'token_already_used' }, 409);
      if (new Date(row.expires_at).getTime() < Date.now())
        return json({ error: 'token_expired' }, 410);

      const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: user.email!,
      });
      if (linkErr) throw linkErr;
      const otpHash = linkData?.properties?.hashed_token;
      const actionLink = linkData?.properties?.action_link;
      if (!otpHash) throw new Error('magic_link_missing_hash');

      const { error: updErr } = await admin
        .from('desktop_link_tokens')
        .update({
          status: 'claimed',
          user_id: user.id,
          email: user.email,
          otp_hash: otpHash,
          action_link: actionLink,
          claimed_at: new Date().toISOString(),
        })
        .eq('token', token)
        .eq('status', 'pending');
      if (updErr) throw updErr;

      return json({ ok: true, email: user.email });
    }

    return json({ error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});
