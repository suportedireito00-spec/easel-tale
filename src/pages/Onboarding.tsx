import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CadastroOnboardingOverlay, {
  type CadastroResult,
} from '@/components/onboarding/CadastroOnboardingOverlay';

const Onboarding = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const finalizar = async (r: CadastroResult) => {
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          status_perfil: r.persona,
          faixa_etaria: r.faixa,
          perfil_tipos: r.persona ? [r.persona] : null,
          perfil_contexto: r.personaLabel || '',
          display_name: r.nome || null,
          areas_interesse: r.areas || [],
          interesses: r.interesses || [],
          whatsapp_number: r.whatsapp || null,
          onboarding_completed_at: new Date().toISOString(),
        } as any)
        .eq('id', user.id);
      if (error) throw error;

      if (Capacitor.isNativePlatform()) {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.requestPermissions();
          const p = await PushNotifications.requestPermissions();
          if (p.receive === 'granted') await PushNotifications.register();
        } catch (e) {
          console.warn('Permissão notificações', e);
        }
      }
      toast.success('Bora estudar!');
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Não consegui salvar seu perfil. Tenta de novo.');
      navigate('/', { replace: true });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-dvh bg-black">
      <CadastroOnboardingOverlay open onFinished={finalizar} />
    </main>
  );
};

export default Onboarding;
