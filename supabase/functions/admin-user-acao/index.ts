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

const TABELAS = [
  'artigos_anotacoes',
  'artigos_favoritos',
  'artigos_grifos',
  'artigos_visualizacoes',
  'biblioteca_favoritos',
  'biblioteca_livros',
  'biblioteca_leitura_progresso',
  'study_sessions',
  'user_activity_log',
  'user_activity_state',
  'user_preferences',
  'user_reminders',
  'user_sessions',
  'user_subscriptions',
  'device_tokens',
  'push_subscriptions',
  'noticias_comentarios',
  'mensagens_suporte',
  'premium_usage',
  'feature_usage',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'missing_auth' }, 401);

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await supabaseUser.auth.getUser();
    const caller = userData?.user;
    if (!caller) return json({ error: 'invalid_session' }, 401);

    const { data: isAdmin } = await supabaseUser.rpc('is_admin_user', { _user_id: caller.id });
    if (!isAdmin) return json({ error: 'forbidden' }, 403);

    const { user_id, acao } = await req.json();
    if (!user_id || !['ban', 'unban', 'delete'].includes(acao)) {
      return json({ error: 'invalid_params' }, 400);
    }
    if (user_id === caller.id) return json({ error: 'self_action_blocked' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    if (acao === 'ban' || acao === 'unban') {
      const { error } = await admin.auth.admin.updateUserById(user_id, {
        ban_duration: acao === 'ban' ? '876000h' : 'none',
      } as any);
      if (error) return json({ error: 'ban_failed', details: error.message }, 500);
      return json({ success: true, acao });
    }

    for (const t of TABELAS) {
      const { error } = await admin.from(t).delete().eq('user_id', user_id);
      if (error) console.warn(`Falha ao limpar ${t}: ${error.message}`);
    }
    await admin.from('profiles').delete().eq('id', user_id);

    const { error: delErr } = await admin.auth.admin.deleteUser(user_id);
    if (delErr) return json({ error: 'auth_delete_failed', details: delErr.message }, 500);

    return json({ success: true, acao: 'delete' });
  } catch (e: any) {
    console.error('admin-user-acao error', e);
    return json({ error: 'server_error', message: e?.message }, 500);
  }
});
