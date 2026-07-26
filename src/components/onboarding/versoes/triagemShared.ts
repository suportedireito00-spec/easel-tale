import { GraduationCap, Scale, Landmark, Briefcase, BookOpen, Video, ScrollText, Clock, Search, Brain, TrendingDown, Compass, FileWarning, CalendarX, Zap } from 'lucide-react';
import personaEstudante from '@/assets/onboarding/persona-estudante.webp';
import personaOAB from '@/assets/onboarding/persona-oab-homem.jpg';
import personaConcurseiro from '@/assets/onboarding/persona-concurseiro.webp';
import personaAdvogado from '@/assets/onboarding/persona-advogado.jpg';

// Filósofos silhuetados — usados na abertura cinematográfica
import filKant from '@/assets/filosofos/kant.webp';
import filAristoteles from '@/assets/filosofos/aristoteles.webp';
import filPlatao from '@/assets/filosofos/platao.webp';
import filMontesquieu from '@/assets/filosofos/montesquieu.webp';
import filRousseau from '@/assets/filosofos/rousseau.webp';
import filLocke from '@/assets/filosofos/locke.webp';
import filHegel from '@/assets/filosofos/hegel.webp';
import filCicero from '@/assets/filosofos/cicero.webp';
import filBeccaria from '@/assets/filosofos/beccaria.webp';
import filKelsen from '@/assets/filosofos/kelsen.webp';
import filRuiBarbosa from '@/assets/filosofos/ruibarbosa.webp';
import filAquino from '@/assets/filosofos/aquino.webp';

export const FILOSOFOS = [
  { nome: 'Kant', src: filKant },
  { nome: 'Aristóteles', src: filAristoteles },
  { nome: 'Platão', src: filPlatao },
  { nome: 'Montesquieu', src: filMontesquieu },
  { nome: 'Rousseau', src: filRousseau },
  { nome: 'Locke', src: filLocke },
  { nome: 'Hegel', src: filHegel },
  { nome: 'Cícero', src: filCicero },
  { nome: 'Beccaria', src: filBeccaria },
  { nome: 'Kelsen', src: filKelsen },
  { nome: 'Rui Barbosa', src: filRuiBarbosa },
  { nome: 'Tomás de Aquino', src: filAquino },
];

export type PersonaId = 'faculdade' | 'oab' | 'concurso' | 'advogado';

export type TriagemResult = {
  persona: PersonaId | null;
  personaLabel: string | null;
  faixa: string | null;
  nome: string;
  areas: string[];
  interesses: string[];
  dores: string[];
  whatsapp: string | null;
};

export const PERSONAS: {
  id: PersonaId;
  label: string;
  desc: string;
  icon: any;
  cover: string;
  accent: string;
}[] = [
  { id: 'faculdade', label: 'Estudante de Direito', desc: 'Estou na faculdade.', icon: GraduationCap, cover: personaEstudante, accent: '#F5C518' },
  { id: 'oab', label: 'Estudando pra OAB', desc: 'Foco no Exame de Ordem.', icon: Scale, cover: personaOAB, accent: '#E85D3A' },
  { id: 'concurso', label: 'Concurseiro(a)', desc: 'Magistratura, MP, Delegado.', icon: Landmark, cover: personaConcurseiro, accent: '#2DD4A8' },
  { id: 'advogado', label: 'Advogado(a)', desc: 'Já sou inscrito(a) na OAB.', icon: Briefcase, cover: personaAdvogado, accent: '#C9A84C' },
];

export const AREAS = [
  'Constitucional', 'Penal', 'Civil', 'Trabalho',
  'Tributário', 'Administrativo', 'Processo Civil', 'Empresarial',
  'Ambiental', 'Consumidor',
];

export const INTERESSES: { id: string; label: string; desc: string; icon: any }[] = [
  { id: 'leis', label: 'Leis atualizadas', desc: 'CF, códigos, súmulas', icon: ScrollText },
  { id: 'livros', label: 'Biblioteca de livros', desc: 'Doutrina e clássicos', icon: BookOpen },
  { id: 'videoaulas', label: 'Videoaulas', desc: 'Aulas em vídeo', icon: Video },
];

export const DORES: { id: string; label: string; desc: string; icon: any }[] = [
  { id: 'leis-desatualizadas', label: 'Não acho leis atualizadas', desc: 'Perco tempo procurando a versão vigente.', icon: FileWarning },
  { id: 'sem-tempo', label: 'Não tenho tempo pra estudar', desc: 'A rotina não deixa espaço fixo.', icon: Clock },
  { id: 'nao-retenho', label: 'Estudo mas não retenho', desc: 'Leio e esqueço no dia seguinte.', icon: Brain },
  { id: 'sem-constancia', label: 'Falta constância', desc: 'Começo forte e abandono no meio.', icon: TrendingDown },
  { id: 'onde-comecar', label: 'Não sei por onde começar', desc: 'Muito conteúdo, pouca direção.', icon: Compass },
  { id: 'busca-lenta', label: 'Perco tempo procurando material', desc: 'Doutrina, jurisprudência, resumo.', icon: Search },
  { id: 'ansiedade-prova', label: 'Ansiedade em prova', desc: 'Trava no dia, esquece o que sabe.', icon: Zap },
  { id: 'sem-agenda', label: 'Não consigo organizar cronograma', desc: 'Não sei distribuir as matérias.', icon: CalendarX },
];

export const FAIXAS = ['18 a 24', '25 a 30', '31 a 40', '41 a 50', '51 ou mais'];

export const emptyResult = (): TriagemResult => ({
  persona: null,
  personaLabel: null,
  faixa: null,
  nome: '',
  areas: [],
  interesses: [],
  dores: [],
  whatsapp: null,
});
