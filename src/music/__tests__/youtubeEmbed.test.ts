import vm from 'node:vm';
import appJson from '../../../app.json';
import type { YoutubeLink } from '../youtube';
import {
  APP_ID,
  EMBED_ORIGIN,
  LOAD_TIMEOUT_MS,
  MAX_SKIPS,
  MIN_PLAYER_SIDE,
  RESTART_DELAY_MS,
  SKIP_DELAY_MS,
  isYoutubeUrl,
  parseEmbedMessage,
  youtubeEmbedHtml,
  youtubeFailureText,
} from '../youtubeEmbed';

const LIST = 'PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG';
const playlist: YoutubeLink = { kind: 'playlist', id: LIST, url: `https://www.youtube.com/playlist?list=${LIST}` };
const video: YoutubeLink = { kind: 'video', id: 'dQw4w9WgXcQ', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' };

describe('identité de l’application', () => {
  it('reprend l’identifiant d’app.json, celui que YouTube reçoit comme Referer', () => {
    expect(APP_ID).toBe(appJson.expo.android.package);
    expect(APP_ID).toBe(appJson.expo.ios.bundleIdentifier);
    expect(EMBED_ORIGIN).toBe(`https://${APP_ID}`);
    expect(new URL(EMBED_ORIGIN).origin).toBe(EMBED_ORIGIN);
  });

  it('respecte la taille minimale du lecteur imposée par YouTube', () => {
    expect(MIN_PLAYER_SIDE).toBe(200);
  });
});

describe('parseEmbedMessage', () => {
  it('lit l’échec signalé par la page du lecteur', () => {
    expect(parseEmbedMessage('{"type":"failed","code":150}')).toEqual({ type: 'failed', code: '150' });
    expect(parseEmbedMessage('{"type":"failed","code":"network"}')).toEqual({ type: 'failed', code: 'network' });
    expect(parseEmbedMessage('{"type":"failed"}')).toEqual({ type: 'failed', code: '' });
  });

  it('ignore tout le reste', () => {
    expect(parseEmbedMessage('pas du json')).toBeNull();
    expect(parseEmbedMessage('null')).toBeNull();
    expect(parseEmbedMessage('42')).toBeNull();
    expect(parseEmbedMessage('{"type":"autre"}')).toBeNull();
    expect(parseEmbedMessage('')).toBeNull();
  });
});

describe('youtubeFailureText', () => {
  it('explique chaque cas en français', () => {
    expect(youtubeFailureText('100')).toMatch(/introuvable ou privée/);
    expect(youtubeFailureText('101')).toMatch(/interdit la lecture hors de YouTube/);
    expect(youtubeFailureText('150')).toBe(youtubeFailureText('101'));
    expect(youtubeFailureText('153')).toMatch(/refusé/);
    expect(youtubeFailureText('network')).toMatch(/connexion/);
    expect(youtubeFailureText('timeout')).toBe(youtubeFailureText('network'));
    expect(youtubeFailureText('crash')).toMatch(/s’est arrêté/);
    expect(youtubeFailureText('2')).toMatch(/pas pu lire/);
    expect(youtubeFailureText('')).toMatch(/pas pu lire/);
  });
});

describe('isYoutubeUrl', () => {
  it('n’accepte que les adresses https de YouTube', () => {
    expect(isYoutubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isYoutubeUrl('https://m.youtube.com/playlist?list=abc')).toBe(true);
    expect(isYoutubeUrl('https://youtube.com/')).toBe(true);
    expect(isYoutubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
  });

  it('refuse le reste', () => {
    expect(isYoutubeUrl('http://www.youtube.com/')).toBe(false);
    expect(isYoutubeUrl('https://youtube.com.evil.example/')).toBe(false);
    expect(isYoutubeUrl('https://evil.example/youtube.com')).toBe(false);
    expect(isYoutubeUrl('https://notyoutube.com/')).toBe(false);
    expect(isYoutubeUrl('intent://scan/#Intent;end')).toBe(false);
    expect(isYoutubeUrl('pas une adresse')).toBe(false);
  });
});

describe('youtubeEmbedHtml', () => {
  it('ne laisse pas un identifiant fermer la balise script', () => {
    const html = youtubeEmbedHtml({ kind: 'playlist', id: '</script><script>alert(1)', url: '' });
    expect(html.match(/<\/script>/g)).toHaveLength(1);
    expect(html).not.toContain('</script><script>alert(1)');
  });
});

// --- la page du lecteur, exécutée avec un faux YouTube -------------------------------------------------------

interface PlayerConfig {
  width: string;
  height: string;
  videoId?: string;
  playerVars: Record<string, unknown>;
  events: Record<'onReady' | 'onStateChange' | 'onError', (event: { data?: number }) => void>;
}

class FakePlayer {
  readonly calls: string[] = [];
  /** titre en cours dans la playlist */
  index = 0;
  constructor(
    readonly target: string,
    readonly config: PlayerConfig,
  ) {}
  playVideo() {
    this.calls.push('play');
  }
  pauseVideo() {
    this.calls.push('pause');
  }
  nextVideo() {
    this.calls.push('next');
  }
  getPlaylistIndex() {
    return this.index;
  }
  playVideoAt(index: number) {
    this.calls.push(`playAt:${index}`);
  }
  seekTo(seconds: number) {
    this.calls.push(`seek:${seconds}`);
  }
  setLoop(loop: boolean) {
    this.calls.push(`loop:${loop}`);
  }
}

const PLAYING = 1;
const PAUSED = 2;
const BUFFERING = 3;
const ENDED = 0;

/** Exécute le script de la page dans un environnement minimal, avec un faux YT et des minuteries à déclencher à la main. */
const loadPage = (link: YoutubeLink) => {
  const html = youtubeEmbedHtml(link);
  const match = /<script>([\s\S]*)<\/script>/.exec(html);
  if (!match) throw new Error('script introuvable');

  const posted: { type: string; code: string }[] = [];
  const timers: { fn: () => void; ms: number }[] = [];
  const appended: { src?: string; onerror?: () => void }[] = [];
  const players: FakePlayer[] = [];
  const doc = {
    createElement: () => ({}) as { src?: string; onerror?: () => void },
    head: { appendChild: (el: { src?: string; onerror?: () => void }) => appended.push(el) },
  };
  const win: Record<string, unknown> = {
    ReactNativeWebView: { postMessage: (message: string) => posted.push(JSON.parse(message)) },
  };
  const YT = {
    Player: function Player(target: string, config: PlayerConfig) {
      const player = new FakePlayer(target, config);
      players.push(player);
      return player;
    },
  };
  const context = vm.createContext({
    window: win,
    document: doc,
    YT,
    JSON,
    setTimeout: (fn: () => void, ms: number) => timers.push({ fn, ms }),
  });
  vm.runInContext(match[1], context);

  const page = {
    posted,
    appended,
    /** YouTube a chargé son API : la page crée le lecteur */
    apiReady: () => {
      (win.onYouTubeIframeAPIReady as () => void)();
      return players[0];
    },
    cadence: win.cadence as { pause: () => void; resume: () => void },
    /** déclenche les minuteries programmées avec ce délai */
    elapse: (ms: number) => {
      const due = timers.filter((t) => t.ms === ms);
      due.forEach((t) => {
        timers.splice(timers.indexOf(t), 1);
        t.fn();
      });
    },
    ready: () => players[0].config.events.onReady({}),
    state: (data: number) => players[0].config.events.onStateChange({ data }),
    error: (data: number) => players[0].config.events.onError({ data }),
  };
  return page;
};

describe('page du lecteur', () => {
  it('charge l’API iframe de YouTube', () => {
    const page = loadPage(playlist);
    expect(page.appended).toHaveLength(1);
    expect(page.appended[0].src).toBe('https://www.youtube.com/iframe_api');
  });

  it('crée un lecteur de playlist qui démarre tout seul, sans plein écran', () => {
    const page = loadPage(playlist);
    const player = page.apiReady();
    expect(player.target).toBe('player');
    expect(player.config.playerVars).toMatchObject({ listType: 'playlist', list: LIST, autoplay: 1, fs: 0, hl: 'fr' });
    expect(player.config.videoId).toBeUndefined();
    expect(player.config.width).toBe('100%');
    expect(player.config.height).toBe('100%');
  });

  it('crée un lecteur de vidéo seule', () => {
    const page = loadPage(video);
    const player = page.apiReady();
    expect(player.config.videoId).toBe(video.id);
    expect(player.config.playerVars.list).toBeUndefined();
  });

  it('lance la lecture et boucle la playlist quand le lecteur est prêt', () => {
    const page = loadPage(playlist);
    const player = page.apiReady();
    page.ready();
    expect(player.calls).toEqual(['loop:true', 'play']);
  });

  it('ne demande pas de boucle pour une vidéo seule', () => {
    const page = loadPage(video);
    const player = page.apiReady();
    page.ready();
    expect(player.calls).toEqual(['play']);
  });

  describe('pause quand l’application quitte l’écran', () => {
    it('met en pause puis reprend si la musique jouait', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(PLAYING);
      player.calls.length = 0;
      page.cadence.pause();
      expect(player.calls).toEqual(['pause']);
      page.state(PAUSED);
      page.cadence.resume();
      expect(player.calls).toEqual(['pause', 'play']);
    });

    it('met aussi en pause pendant la mise en mémoire tampon', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(BUFFERING);
      player.calls.length = 0;
      page.cadence.pause();
      page.cadence.resume();
      expect(player.calls).toEqual(['pause', 'play']);
    });

    it('ne relance pas ce que tu avais mis en pause toi-même', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(PLAYING);
      page.state(PAUSED);
      player.calls.length = 0;
      page.cadence.pause();
      page.cadence.resume();
      expect(player.calls).toEqual([]);
    });

    it('ne démarre rien si l’application passe en arrière-plan pendant le chargement', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.cadence.pause();
      page.ready();
      expect(player.calls).toEqual(['loop:true']);
      page.cadence.resume();
      expect(player.calls).toEqual(['loop:true', 'play']);
    });

    it('n’écoute pas la visibilité de la page : seule l’application décide de la pause', () => {
      const html = youtubeEmbedHtml(playlist);
      expect(html).not.toContain('visibilitychange');
      expect(html).not.toContain('document.hidden');
    });

    it('coupe une lecture qui démarre en retard pendant la suspension', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.cadence.pause();
      player.calls.length = 0;
      page.state(PLAYING);
      expect(player.calls).toEqual(['pause']);
      page.state(PAUSED);
      page.cadence.resume();
      expect(player.calls).toEqual(['pause', 'play']);
    });
  });

  describe('vidéos illisibles', () => {
    it.each([100, 101, 150])('saute la vidéo en erreur %i dans une playlist', (code) => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      player.calls.length = 0;
      page.error(code);
      expect(player.calls).toEqual([]);
      page.elapse(SKIP_DELAY_MS);
      expect(player.calls).toEqual(['next']);
      expect(page.posted).toEqual([]);
    });

    it('ne saute pas un titre de plus quand le lecteur est déjà passé au suivant', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      player.calls.length = 0;
      page.error(150);
      player.index = 1;
      page.elapse(SKIP_DELAY_MS);
      expect(player.calls).toEqual([]);
    });

    it('saute quand le lecteur ne donne pas la position dans la playlist', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      player.getPlaylistIndex = () => {
        throw new Error('indisponible');
      };
      player.calls.length = 0;
      page.error(101);
      page.elapse(SKIP_DELAY_MS);
      expect(player.calls).toEqual(['next']);
    });

    it('renonce quand toute la suite est illisible', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      for (let i = 0; i < MAX_SKIPS; i += 1) {
        page.error(150);
        page.elapse(SKIP_DELAY_MS);
      }
      expect(player.calls.filter((call) => call === 'next')).toHaveLength(MAX_SKIPS);
      expect(page.posted).toEqual([]);
      page.error(150);
      expect(page.posted).toEqual([{ type: 'failed', code: '150' }]);
    });

    it('recompte depuis zéro dès qu’une vidéo se lit', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      for (let i = 0; i < MAX_SKIPS; i += 1) {
        page.error(101);
        page.elapse(SKIP_DELAY_MS);
      }
      page.state(PLAYING);
      page.error(101);
      page.elapse(SKIP_DELAY_MS);
      expect(page.posted).toEqual([]);
      expect(player.calls.filter((call) => call === 'next')).toHaveLength(MAX_SKIPS + 1);
    });

    it('signale tout de suite les autres erreurs', () => {
      const page = loadPage(playlist);
      page.apiReady();
      page.error(2);
      expect(page.posted).toEqual([{ type: 'failed', code: '2' }]);
    });

    it('signale tout de suite l’erreur d’une vidéo seule', () => {
      const page = loadPage(video);
      page.apiReady();
      page.error(150);
      expect(page.posted).toEqual([{ type: 'failed', code: '150' }]);
    });

    it('ne signale l’échec qu’une fois', () => {
      const page = loadPage(video);
      page.apiReady();
      page.error(100);
      page.error(100);
      expect(page.posted).toHaveLength(1);
    });
  });

  describe('fin de la lecture', () => {
    it('repart du premier titre quand la playlist ne reboucle pas d’elle-même', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(ENDED);
      expect(player.calls).not.toContain('playAt:0');
      page.elapse(RESTART_DELAY_MS);
      expect(player.calls).toContain('playAt:0');
    });

    it('laisse faire le lecteur quand il a déjà repris tout seul', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(ENDED);
      page.state(PLAYING);
      page.elapse(RESTART_DELAY_MS);
      expect(player.calls).not.toContain('playAt:0');
    });

    it('ne relance pas la playlist pendant la suspension', () => {
      const page = loadPage(playlist);
      const player = page.apiReady();
      page.ready();
      page.state(ENDED);
      page.cadence.pause();
      page.elapse(RESTART_DELAY_MS);
      expect(player.calls).not.toContain('playAt:0');
    });

    it('rejoue une vidéo seule', () => {
      const page = loadPage(video);
      const player = page.apiReady();
      page.ready();
      player.calls.length = 0;
      page.state(ENDED);
      expect(player.calls).toEqual(['seek:0', 'play']);
    });
  });

  describe('YouTube injoignable', () => {
    it('signale un réseau absent quand l’API ne se charge pas', () => {
      const page = loadPage(playlist);
      page.appended[0].onerror?.();
      expect(page.posted).toEqual([{ type: 'failed', code: 'network' }]);
    });

    it('signale un délai dépassé quand le lecteur ne devient jamais prêt', () => {
      const page = loadPage(playlist);
      page.elapse(LOAD_TIMEOUT_MS);
      expect(page.posted).toEqual([{ type: 'failed', code: 'timeout' }]);
    });

    it('ne signale rien quand le lecteur est prêt à temps', () => {
      const page = loadPage(playlist);
      page.apiReady();
      page.ready();
      page.elapse(LOAD_TIMEOUT_MS);
      expect(page.posted).toEqual([]);
    });

    it('n’annonce pas de délai dépassé pendant que l’application est en arrière-plan', () => {
      const page = loadPage(playlist);
      page.cadence.pause();
      page.elapse(LOAD_TIMEOUT_MS);
      expect(page.posted).toEqual([]);
    });
  });
});
