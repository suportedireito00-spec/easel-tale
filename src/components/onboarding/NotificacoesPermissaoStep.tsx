import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { motion } from 'framer-motion';
import { Bell, Gavel, CalendarClock, Newspaper, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWebPush } from '@/hooks/useWebPush';

const BENEFICIOS = [
  { icon: Gavel, titulo: 'Novidades jurídicas', desc: 'Mudanças em leis e súmulas da sua área.' },
  { icon: CalendarClock, titulo: 'Lembretes de estudo', desc: 'Avisos dos seus prazos e revisões.' },
  { icon: Newspaper, titulo: 'Resumo do dia', desc: 'Só o que importa — sem spam.' },
];

/**
 * Passo contextualizado de permissão de notificações, exibido no fim da triagem
 * de cadastro. Explica o porquê antes de disparar o prompt do sistema.
 */
export default function NotificacoesPermissaoStep({
  onDone,
}: {
  onDone: (granted: boolean) => void;
}) {
  const [loading, setLoading] = useState(false);
  const { supported: webSupported, subscribe } = useWebPush();

  const ativar = async () => {
    setLoading(true);
    let granted = false;
    try {
      if (Capacitor.isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        try { await LocalNotifications.requestPermissions(); } catch {}
        const p = await PushNotifications.requestPermissions();
        granted = p.receive === 'granted';
        if (granted) {
          await PushNotifications.register();
          try {
            const { registerNativePushToken } = await import('@/lib/nativePush');
            await registerNativePushToken();
          } catch {}
        }
      } else if (webSupported) {
        granted = await subscribe();
      }
    } catch (e) {
      console.warn('[NotificacoesPermissaoStep]', e);
    } finally {
      setLoading(false);
      onDone(granted);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-background/95 backdrop-blur-sm">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="mx-auto w-full max-w-md space-y-6 rounded-t-3xl border-t border-border bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Ativar notificações
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pra te avisar do que realmente importa no seu estudo e na sua área do Direito.
          </p>
        </div>

        <ul className="space-y-3">
          {BENEFICIOS.map(({ icon: Icon, titulo, desc }) => (
            <li key={titulo} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{titulo}</span>
                <span className="block text-xs text-muted-foreground">{desc}</span>
              </span>
            </li>
          ))}
        </ul>

        <p className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          Você pode desativar quando quiser nas configurações.
        </p>

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={ativar} disabled={loading}>
            {loading ? 'Ativando…' : 'Permitir notificações'}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => onDone(false)}
            disabled={loading}
          >
            Agora não
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
