import { useCallback, useEffect, useRef, useState } from 'react';
import tapAsset from '@/assets/onboarding/audio/tap.mp3.asset.json';
import whooshAsset from '@/assets/onboarding/audio/whoosh.mp3.asset.json';
import dingAsset from '@/assets/onboarding/audio/ding.mp3.asset.json';

const MUTE_KEY = 'triagem:muted';

export type Sfx = 'tap' | 'whoosh' | 'ding';

/**
 * Áudio da triagem — sem música ambiente. Apenas SFX curtos e suaves.
 */
export function useTriagemAudio(_active: boolean) {
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(MUTE_KEY) === '1';
  });
  const sfxRefs = useRef<Record<Sfx, HTMLAudioElement | null>>({
    tap: null,
    whoosh: null,
    ding: null,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sfxRefs.current.tap = new Audio(tapAsset.url);
    sfxRefs.current.whoosh = new Audio(whooshAsset.url);
    sfxRefs.current.ding = new Audio(dingAsset.url);
    if (sfxRefs.current.tap) sfxRefs.current.tap.volume = 0.18;
    if (sfxRefs.current.whoosh) sfxRefs.current.whoosh.volume = 0.22;
    if (sfxRefs.current.ding) sfxRefs.current.ding.volume = 0.35;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      const next = !m;
      try {
        window.localStorage.setItem(MUTE_KEY, next ? '1' : '0');
      } catch {}
      return next;
    });
  }, []);

  const playSfx = useCallback(
    (kind: Sfx) => {
      if (muted) return;
      const a = sfxRefs.current[kind];
      if (!a) return;
      try {
        a.currentTime = 0;
        a.play().catch(() => void 0);
      } catch {}
    },
    [muted],
  );

  return { muted, toggleMute, playSfx };
}
