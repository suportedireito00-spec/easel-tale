/**
 * Cache stale-while-revalidate dos posts do blog no localStorage.
 * — 1ª visita: fetch normal, popula cache.
 * — Visitas seguintes (24 h): hidrata sincronamente e revalida em background.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost, BlogTema } from '@/data/blogPosts';
import { TEMAS } from '@/data/blogPosts';
import { bundle } from '@/services/offlineBundle';

const KEY = 'blog:posts:v1';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 h

type RawPost = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo_md: string;
  imagem_url: string;
  categoria: string;
  autor: string;
  tempo_leitura_min: number;
  data_publicacao: string;
  created_at: string;
};

type Cached = { at: number; posts: BlogPost[] };

function map(rows: RawPost[]): BlogPost[] {
  return rows.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    resumo: p.resumo,
    conteudo_md: p.conteudo_md,
    imagem_url: p.imagem_url,
    tema: (TEMAS.includes(p.categoria as BlogTema) ? p.categoria : 'Curiosidades') as BlogTema,
    autor: p.autor,
    tempo_leitura_min: p.tempo_leitura_min,
    data_publicacao: p.data_publicacao,
  }));
}

function readCache(): BlogPost[] | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Cached;
    if (!parsed?.posts || !Array.isArray(parsed.posts)) return null;
    // Aceitamos até TTL para tela; refresh sempre roda em background de qualquer forma.
    if (Date.now() - parsed.at > TTL_MS) return parsed.posts; // ainda hidrata, marca stale
    return parsed.posts;
  } catch {
    return null;
  }
}

function writeCache(posts: BlogPost[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ at: Date.now(), posts } satisfies Cached));
  } catch {
    /* quota / private mode — ignora */
  }
}

export function useBlogPostsCache() {
  const initial = useMemo(() => readCache(), []);
  const [posts, setPosts] = useState<BlogPost[]>(initial ?? []);
  const [loaded, setLoaded] = useState<boolean>(!!initial);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let rows: RawPost[] | null = null;
      try {
        const { data } = await supabase
          .from('blog_edicao_posts')
          .select(
            'id, titulo, resumo, conteudo_md, imagem_url, categoria, autor, tempo_leitura_min, data_publicacao, created_at',
          )
          .eq('publicado', true)
          .order('data_publicacao', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100);
        rows = (data as RawPost[]) ?? null;
      } catch {}
      // Fallback pro bundle nativo (Electron / sem rede)
      if (!rows || rows.length === 0) {
        const bundled = await bundle.blogPosts<RawPost>();
        if (bundled.length > 0) rows = bundled;
      }
      if (cancelled) return;
      if (rows && rows.length > 0) {
        const mapped = map(rows);
        setPosts(mapped);
        writeCache(mapped);
      }
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { posts, loaded };
}
