import capa1 from './capa-1.jpg';
import capa2 from './capa-2.jpg';
import capa3 from './capa-3.jpg';

export type PessoalCover = {
  id: string;
  label: string;
  src: string;
};

export const PESSOAL_COVERS: PessoalCover[] = [
  { id: 'capa1', label: 'Balança & livros', src: capa1 },
  { id: 'capa2', label: 'Templo do Direito', src: capa2 },
  { id: 'capa3', label: 'Estudante', src: capa3 },
];

export function getCoverSrc(id: string | null | undefined): string {
  return (PESSOAL_COVERS.find((c) => c.id === id) ?? PESSOAL_COVERS[0]).src;
}
