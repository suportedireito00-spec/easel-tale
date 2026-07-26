import { useEffect, useState } from 'react';
import { MapPin, X } from 'lucide-react';
import { subscribeGeofencePresence, type GeofenceReminder } from '@/lib/nativeGeofence';
import { useAuth } from '@/hooks/useAuth';

/**
 * Banner fixo no topo do app enquanto o usuário está DENTRO do raio de algum
 * lembrete ativo. Some quando sai. Só aparece pra usuário logado.
 */
export function GeofencePresenceBanner() {
  const { user } = useAuth();
  const [inside, setInside] = useState<GeofenceReminder[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    return subscribeGeofencePresence(setInside);
  }, [user]);

  if (!user) return null;
  const visible = inside.filter(r => !dismissedIds.has(r.id));
  if (!visible.length) return null;

  const first = visible[0];
  return (
    <div
      className="fixed left-1/2 z-[70] -translate-x-1/2 max-w-[94vw] w-full sm:w-[560px] px-3"
      style={{ top: 'calc(env(safe-area-inset-top, 0px) + 88px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 backdrop-blur-md px-5 py-4 shadow-xl">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500/25 flex items-center justify-center">
          <MapPin className="h-6 w-6 text-emerald-300" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-emerald-50 text-base leading-tight truncate">Você está no local: {first.label}</p>
          <p className="text-sm text-emerald-200/90 mt-0.5 leading-snug">
            {visible.length > 1
              ? `+${visible.length - 1} outro(s) lembrete(s) neste local`
              : 'O lembrete será disparado novamente quando você sair e voltar.'}
          </p>
        </div>
        <button
          onClick={() => setDismissedIds(prev => new Set(prev).add(first.id))}
          className="rounded-full p-2 text-emerald-100/80 hover:bg-emerald-500/20 hover:text-emerald-50 shrink-0"
          aria-label="Dispensar aviso"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default GeofencePresenceBanner;
