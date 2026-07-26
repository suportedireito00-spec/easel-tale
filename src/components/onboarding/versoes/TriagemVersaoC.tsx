import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Volume2, VolumeX, X } from 'lucide-react';
import {
  DORES,
  FILOSOFOS,
  INTERESSES,
  PERSONAS,
  emptyResult,
  type PersonaId,
  type TriagemResult,
} from './triagemShared';
import { useTriagemAudio } from './useTriagemAudio';

const CadastroFeaturesReel = lazy(() => import('../CadastroFeaturesReel'));

type Props = {
  open: boolean;
  onFinished: (r: TriagemResult) => void;
  previewMode?: boolean;
};

type Step = 'abertura' | 'persona' | 'interesses' | 'dores' | 'nome' | 'whatsapp' | 'features';
const CONTENT_STEPS: Step[] = ['persona', 'interesses', 'dores', 'nome', 'whatsapp'];

const CARD_BG: Record<Exclude<Step, 'abertura' | 'features'>, { grad: string; accent: string; label: string }> = {
  persona: { grad: 'linear-gradient(140deg, #F5C518 0%, #E0A000 55%, #8B6508 100%)', accent: '#1A1204', label: 'PERFIL' },
  interesses: { grad: 'linear-gradient(140deg, #2DD4A8 0%, #14a37f 55%, #0F4C3A 100%)', accent: '#03170F', label: 'FOCO' },
  dores: { grad: 'linear-gradient(140deg, #E85D3A 0%, #B23A20 55%, #5C1A0F 100%)', accent: '#FFF3EB', label: 'DORES' },
  nome: { grad: 'linear-gradient(140deg, #3B82F6 0%, #2453B6 55%, #16265E 100%)', accent: '#F0F9FF', label: 'NOME' },
  whatsapp: { grad: 'linear-gradient(140deg, #C084FC 0%, #8B4FD9 55%, #4A1D8B 100%)', accent: '#FAF5FF', label: 'CONTATO' },
};

export default function TriagemVersaoC({ open, onFinished }: Props) {
  const [step, setStep] = useState<Step>('abertura');
  const [data, setData] = useState<TriagemResult>(emptyResult());
  const { muted, toggleMute, playSfx } = useTriagemAudio(open);

  useEffect(() => {
    if (open) {
      setStep('abertura');
      setData(emptyResult());
    }
  }, [open]);

  const stepIndex =
    step === 'abertura' ? -1 : step === 'features' ? CONTENT_STEPS.length - 1 : CONTENT_STEPS.indexOf(step);
  const bg = step === 'abertura' || step === 'features' ? CARD_BG.persona : CARD_BG[step];

  const advance = (patch: Partial<TriagemResult>) => {
    playSfx('whoosh');
    const next = { ...data, ...patch };
    setData(next);
    if (step === 'abertura') {
      setStep('persona');
      return;
    }
    const nx = CONTENT_STEPS[stepIndex + 1];
    if (nx) setStep(nx);
    else {
      // Última pergunta respondida → entra no reel de funções antes de fechar.
      playSfx('ding');
      setStep('features');
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#0A0A0A]"
    >
      {/* Top bar — só aparece após abertura */}
      {step !== 'abertura' && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-20 flex items-center justify-between px-4 pt-4"
          style={{ paddingTop: 'calc(env(safe-area-inset-top,0px) + 12px)' }}
        >
          <button
            onClick={toggleMute}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="flex-1 flex items-center gap-1.5 mx-3">
            {CONTENT_STEPS.map((s, i) => (
              <div key={s} className="flex-1 h-1 rounded-full bg-white/20 overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={false}
                  animate={{ width: i <= stepIndex ? '100%' : '0%' }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={() => onFinished(data)}
            className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Stack */}
      <div
        className="relative flex-1 flex items-stretch justify-center px-3 pt-3 sm:pt-4"
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 20px)',
        }}
      >
        <AnimatePresence mode="wait">
          {step === 'abertura' ? (
            <AberturaCinematografica key="abertura" onDone={() => advance({})} muted={muted} toggleMute={toggleMute} />
          ) : step === 'features' ? (
            <Suspense key="features" fallback={<div className="absolute inset-0 bg-black" />}>
              <CadastroFeaturesReel
                nome={data.nome}
                onDone={() => onFinished(data)}
                playSfx={playSfx}
              />
            </Suspense>
          ) : (
            <motion.div
              key={step}
              initial={{ x: 340, rotate: 6, opacity: 0, scale: 0.94 }}
              animate={{ x: 0, rotate: 0, opacity: 1, scale: 1 }}
              exit={{ x: -340, rotate: -6, opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 190, damping: 24 }}
              className="relative w-full max-w-lg rounded-[36px] overflow-hidden flex flex-col shadow-2xl"
              style={{ background: bg.grad, color: bg.accent, minHeight: '78dvh' }}
            >
              {/* Textura de filósofos suave no card */}
              <FilosofosTextura />

              <div className="relative z-10 px-6 pt-6 flex items-center justify-between">
                <span className="text-[11px] font-black tracking-[0.35em] opacity-80">{bg.label}</span>
                <span className="text-[11px] font-bold opacity-80">
                  {stepIndex + 1}/{CONTENT_STEPS.length}
                </span>
              </div>

              <CardContent step={step as Exclude<Step, 'abertura' | 'features'>} data={data} setData={setData} advance={advance} playSfx={playSfx} bg={bg} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* -------------------------- Abertura Cinematográfica -------------------------- */

function AberturaCinematografica({
  onDone,
  muted,
  toggleMute,
}: {
  onDone: () => void;
  muted: boolean;
  toggleMute: () => void;
}) {
  // Roteiro (frames em ms): filósofos aparecem em cascata sobre marrom → flash amarelo → título
  const [phase, setPhase] = useState<0 | 1 | 2>(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 2600); // flash amarelo
    const t2 = setTimeout(() => setPhase(2), 3100); // título amarelo
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const filosofosOrdem = useMemo(() => {
    // 6 posições ao redor da tela
    const posicoes = [
      { top: '8%', left: '6%', size: 130, rot: -8 },
      { top: '14%', right: '4%', size: 150, rot: 6 },
      { top: '42%', left: '2%', size: 170, rot: -4 },
      { top: '38%', right: '2%', size: 160, rot: 5 },
      { bottom: '10%', left: '8%', size: 140, rot: -6 },
      { bottom: '14%', right: '6%', size: 155, rot: 7 },
    ];
    return posicoes.map((pos, i) => ({ ...pos, ...FILOSOFOS[i % FILOSOFOS.length] }));
  }, []);

  return (
    <motion.div
      key="abertura-root"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
      style={{
        background:
          phase >= 1
            ? 'linear-gradient(140deg, #F5C518 0%, #E0A000 60%, #A97600 100%)'
            : 'radial-gradient(ellipse at 50% 40%, #4A2A18 0%, #2A1810 55%, #150A05 100%)',
        transition: 'background 700ms ease',
      }}
    >
      {/* Botão mute discreto */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center"
        style={{ top: 'calc(env(safe-area-inset-top,0px) + 12px)' }}
      >
        {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Vinheta */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 45%, transparent 40%, rgba(0,0,0,0.55) 100%)' }} />

      {/* Filósofos flutuando */}
      <AnimatePresence>
        {phase === 0 &&
          filosofosOrdem.map((f, i) => (
            <motion.img
              key={f.nome}
              src={f.src}
              alt={f.nome}
              initial={{ opacity: 0, scale: 0.7, filter: 'blur(12px)' }}
              animate={{
                opacity: [0, 0.85, 0.85, 0],
                scale: [0.7, 1, 1.05, 1.15],
                filter: ['blur(12px)', 'blur(0px)', 'blur(0px)', 'blur(6px)'],
              }}
              transition={{
                duration: 2.4,
                delay: i * 0.18,
                times: [0, 0.35, 0.75, 1],
                ease: 'easeOut',
              }}
              className="absolute pointer-events-none select-none"
              style={{
                ...f,
                width: f.size,
                height: 'auto',
                mixBlendMode: 'screen',
                filter: 'brightness(0) invert(1) drop-shadow(0 8px 24px rgba(0,0,0,0.6))',
                transform: `rotate(${f.rot}deg)`,
              }}
            />
          ))}
      </AnimatePresence>

      {/* Título fase 0 — sussurro */}
      <AnimatePresence>
        {phase === 0 && (
          <motion.div
            key="p0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative z-20 text-center px-8"
          >
            <div className="text-[11px] font-black tracking-[0.5em] text-white/60 mb-4">
              DOS CLÁSSICOS AOS CÓDIGOS
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-white leading-[0.95]" style={{ fontFamily: 'Georgia, serif' }}>
              O Direito<br />
              <span className="italic text-white/80">pensado por quem</span><br />
              o construiu.
            </h1>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Flash amarelo */}
      <AnimatePresence>
        {phase === 1 && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle, #FFE066 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      {/* Título fase 2 — amarelo com CTA */}
      <AnimatePresence>
        {phase === 2 && (
          <motion.div
            key="p2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            className="relative z-20 text-center px-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-[11px] font-black tracking-[0.5em] text-black/70 mb-4"
            >
              BEM-VINDO(A)
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="text-5xl sm:text-6xl font-black text-black leading-[0.9]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              Vamos <span className="italic">te conhecer</span>.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-black/70 text-base max-w-sm mx-auto"
            >
              Cinco toques rápidos pra ajustar o app ao seu jeito de estudar.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200 }}
              onClick={onDone}
              className="mt-8 h-14 px-8 rounded-full bg-black text-white font-black text-base inline-flex items-center gap-2 active:scale-95 shadow-2xl"
            >
              Começar <ArrowRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* Textura sutil de filósofos no fundo do card */
function FilosofosTextura() {
  const spots = [
    { src: FILOSOFOS[0].src, top: '-30px', right: '-40px', size: 220, op: 0.08, rot: 8 },
    { src: FILOSOFOS[3].src, bottom: '-40px', left: '-50px', size: 260, op: 0.06, rot: -6 },
  ];
  return (
    <>
      {spots.map((s, i) => (
        <img
          key={i}
          src={s.src}
          alt=""
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{
            top: s.top,
            bottom: s.bottom,
            left: s.left,
            right: s.right,
            width: s.size,
            opacity: s.op,
            transform: `rotate(${s.rot}deg)`,
            filter: 'brightness(0) invert(1)',
          }}
        />
      ))}
    </>
  );
}

/* -------------------------- Conteúdo dos passos -------------------------- */

function CardContent({
  step,
  data,
  setData,
  advance,
  playSfx,
  bg,
}: {
  step: Exclude<Step, 'abertura' | 'features'>;
  data: TriagemResult;
  setData: React.Dispatch<React.SetStateAction<TriagemResult>>;
  advance: (patch: Partial<TriagemResult>) => void;
  playSfx: (k: 'tap' | 'whoosh' | 'ding') => void;
  bg: { grad: string; accent: string; label: string };
}) {
  const nome1 = data.nome.trim().split(' ')[0];

  return (
    <div className="relative z-10 flex-1 flex flex-col px-6 pt-4 pb-8 overflow-y-auto">
      {step === 'persona' && (
        <>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2 mb-4">Qual é o seu perfil?</h2>
          <div className="flex-1 grid grid-cols-2 gap-3 mt-2 content-start">
            {PERSONAS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  playSfx('tap');
                  advance({ persona: p.id as PersonaId, personaLabel: p.label });
                }}
                className="relative overflow-hidden rounded-2xl aspect-[3/4] shadow-lg"
              >
                <img src={p.cover} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left text-white">
                  <div className="font-black text-sm leading-tight">{p.label}</div>
                  <div className="text-white/70 text-[11px]">{p.desc}</div>
                </div>
              </motion.button>
            ))}
          </div>
        </>
      )}

      {step === 'interesses' && (
        <>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2 mb-1">O que procura?</h2>
          <p className="text-sm opacity-80 mb-4">Marque as funções que mais te interessam</p>
          <div className="flex-1 space-y-3">
            {INTERESSES.map((it) => {
              const Icon = it.icon;
              const on = data.interesses.includes(it.id);
              return (
                <motion.button
                  key={it.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playSfx('tap');
                    setData((d) => ({
                      ...d,
                      interesses: d.interesses.includes(it.id)
                        ? d.interesses.filter((x) => x !== it.id)
                        : [...d.interesses, it.id],
                    }));
                  }}
                  className={`w-full rounded-2xl p-4 flex items-center gap-3 border-2 transition text-left ${
                    on ? 'bg-black text-white border-black' : 'bg-white/25 backdrop-blur border-white/40'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex-1">
                    <div className="font-black text-sm">{it.label}</div>
                    <div className="text-xs opacity-80">{it.desc}</div>
                  </div>
                  {on && <Check className="w-5 h-5" />}
                </motion.button>
              );
            })}
          </div>
          <ContinueBtn disabled={data.interesses.length === 0} onClick={() => advance({})} />
        </>
      )}

      {step === 'dores' && (
        <>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2 mb-1">Quais são suas dores?</h2>
          <p className="text-sm opacity-80 mb-4">Marque o que trava seus estudos</p>
          <div className="flex-1 space-y-2.5">
            {DORES.map((d) => {
              const Icon = d.icon;
              const on = data.dores.includes(d.id);
              return (
                <motion.button
                  key={d.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    playSfx('tap');
                    setData((prev) => ({
                      ...prev,
                      dores: prev.dores.includes(d.id)
                        ? prev.dores.filter((x) => x !== d.id)
                        : [...prev.dores, d.id],
                    }));
                  }}
                  className={`w-full rounded-2xl p-3.5 flex items-center gap-3 border-2 transition text-left ${
                    on ? 'bg-black text-white border-black' : 'bg-white/25 backdrop-blur border-white/40'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[13px] leading-tight">{d.label}</div>
                    <div className="text-[11px] opacity-80 leading-snug">{d.desc}</div>
                  </div>
                  {on && <Check className="w-4 h-4 shrink-0" />}
                </motion.button>
              );
            })}
          </div>
          <ContinueBtn disabled={data.dores.length === 0} onClick={() => advance({})} />
        </>
      )}

      {step === 'nome' && (
        <>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2 mb-1">
            Bora estudar{nome1 ? <>, <span className="italic">{nome1}</span>!</> : '...'}
          </h2>
          <p className="text-sm opacity-80 mb-6">Como quer ser chamado?</p>
          <input
            autoFocus
            value={data.nome}
            onChange={(e) => setData((d) => ({ ...d, nome: e.target.value.slice(0, 40) }))}
            onKeyDown={(e) => e.key === 'Enter' && data.nome.trim() && advance({})}
            placeholder="Digite seu nome"
            className="w-full h-14 px-5 rounded-2xl bg-white/30 backdrop-blur border-2 border-white/50 text-lg font-semibold outline-none focus:border-black placeholder-black/40"
            style={{ color: bg.accent }}
          />
          <div className="flex-1" />
          <ContinueBtn disabled={!data.nome.trim()} onClick={() => advance({})} />
        </>
      )}

      {step === 'whatsapp' && (
        <>
          <h2 className="text-3xl sm:text-4xl font-black leading-tight mt-2 mb-1">Um WhatsApp?</h2>
          <p className="text-sm opacity-80 mb-6">Pra receber lembretes de leitura. Opcional.</p>
          <input
            value={data.whatsapp || ''}
            onChange={(e) =>
              setData((d) => ({
                ...d,
                whatsapp: e.target.value.replace(/[^\d+\s()-]/g, '').slice(0, 20),
              }))
            }
            placeholder="(11) 98765-4321"
            className="w-full h-14 px-5 rounded-2xl bg-white/30 backdrop-blur border-2 border-white/50 text-lg font-semibold outline-none focus:border-black placeholder-black/40"
            style={{ color: bg.accent }}
          />
          <div className="flex-1" />
          <div className="flex gap-2">
            <button
              onClick={() => advance({ whatsapp: null })}
              className="flex-1 h-14 rounded-2xl bg-white/20 border-2 border-white/40 font-bold active:scale-95"
            >
              Pular
            </button>
            <button
              onClick={() =>
                advance({
                  whatsapp:
                    data.whatsapp && data.whatsapp.replace(/\D/g, '').length >= 10
                      ? data.whatsapp
                      : null,
                })
              }
              className="flex-1 h-14 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2 active:scale-95"
            >
              Finalizar <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ContinueBtn({ disabled, onClick }: { disabled: boolean; onClick: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="mt-4 h-14 rounded-2xl bg-black text-white font-bold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30"
    >
      Continuar <ArrowRight className="w-5 h-5" strokeWidth={2.5} />
    </button>
  );
}
