import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';

/**
 * Roteador genérico de deep links nativos.
 * Formatos suportados:
 *   - vacatio://lei/{slug}/art-{numero}
 *   - vacatio://noticia/{id}
 *   - vacatio://radar/pl/{id}
 *   - https://vacatio.com.br/lei/{slug}/art-{numero}  (App Links, mesmo layout)
 *
 * Uso: chamar `initDeepLinkRouter(navigate)` uma vez no root do app.
 * O router ignora URLs de OAuth (delegadas ao useAuth) — nunca duplica.
 */

let listener: { remove: () => void } | undefined;
let appUrlOpened = false;

type NavigateFn = (path: string) => void;

const SMART_LINK_ORIGIN = 'https://vacatio.com.br';
const DEFERRED_CONSUMED_KEY = 'vacatio.deferred_deep_link_consumed';

function parseDeepLink(url: string): string | null {
  // OAuth callback → deixar useAuth cuidar
  if (url.includes('auth-callback')) return null;

  try {
    const u = new URL(url);
    // Extrai path/params. Suporta tanto esquema custom (vacatio://lei/...)
    // quanto App Links (https://vacatio.com.br/lei/...).
    const isCustomScheme = u.protocol === 'br.com.vacatio.app:' || u.protocol === 'vacatio:';
    const isAppLink =
      (u.protocol === 'https:' || u.protocol === 'http:') &&
      (u.hostname === 'vacatio.com.br' || u.hostname === 'www.vacatio.com.br');

    if (!isCustomScheme && !isAppLink) return null;

    // Em vacatio://lei/xyz, o hostname vira "lei" e pathname "/xyz"
    // Em https://vacatio.com.br/lei/xyz, hostname é o domínio e pathname "/lei/xyz"
    const rawPath = isCustomScheme
      ? `/${u.hostname}${u.pathname}`.replace(/\/+/g, '/')
      : u.pathname;

    const segments = rawPath.split('/').filter(Boolean);
    if (segments.length === 0) return '/';

    const [type, ...rest] = segments;

    switch (type) {
      case 'lei': {
        // /lei/{slug} ou /lei/{slug}/art-{n}
        const slug = rest[0];
        const artPart = rest[1]; // ex: "art-5"
        if (!slug) return '/';
        const artigoMatch = artPart?.match(/^art-?(.+)$/i);
        if (artigoMatch) {
          return `/legislacao/${slug}?artigo=${encodeURIComponent(artigoMatch[1])}`;
        }
        return `/legislacao/${slug}`;
      }
      case 'noticia':
        return rest[0] ? `/noticias?id=${encodeURIComponent(rest[0])}` : '/noticias';
      case 'radar':
        if (rest[0] === 'pl' && rest[1]) return `/radar/pl/${rest[1]}`;
        if (rest[0] === 'deputado' && rest[1]) return `/radar/deputado/${rest[1]}`;
        return '/radar-360';
      case 'novidades':
        return '/novidades';
      case 'buscar':
      case 'search':
        return '/buscar';
      case 'evelyn':
      case 'assistente':
        return '/assistente';
      case 'radar-360':
        return '/radar-360';
      case 'aprender':
        return rest[0] ? `/aprender/${rest[0]}` : '/aprender';
      case 'audio':
        return '/anotacoes/audio';
      case 'lembretes':
        return rest[0] === 'local' ? '/lembretes/local' : '/meus-lembretes';
      case 'leitura':
      case 'continuar':
        return '/biblioteca?continuar=1';
      case 'shortcut': {
        // vacatio://shortcut/<slug>
        // Fallback: delega ao mapa em nativeShortcuts.ts
        return rest[0] ? `/${rest[0]}` : '/';
      }
      default:
        return `/${segments.join('/')}`;
    }
  } catch (e) {
    console.warn('Deep link parse falhou', url, e);
    return null;
  }
}

export async function initDeepLinkRouter(navigate: NavigateFn) {
  if (!Capacitor.isNativePlatform()) return;
  if (listener) return; // já inicializado

  try {
    listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
      const target = parseDeepLink(url);
      if (target) {
        // pequeno delay pra garantir que rotas estão registradas
        setTimeout(() => navigate(target), 50);
      }
    });
  } catch (e) {
    console.warn('DeepLink init falhou', e);
  }
}

export function disposeDeepLinkRouter() {
  listener?.remove();
  listener = undefined;
}

/** Gera URL compartilhável (App Link) para um artigo. */
export function buildArtigoShareUrl(slug: string, numero?: string): string {
  const base = `https://vacatio.com.br/lei/${slug}`;
  return numero ? `${base}/art-${encodeURIComponent(numero)}` : base;
}
