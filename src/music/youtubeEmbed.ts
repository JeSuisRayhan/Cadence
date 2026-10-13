import type { YoutubeLink } from './youtube';

/** Identifiant Android de l'application (voir app.json) : YouTube veut qu'un lecteur intégré s'identifie par lui. */
export const APP_ID = 'com.pouzine.cadence';

/**
 * Adresse de base de la page du lecteur. Android en fait l'en-tête Referer, ce qui identifie l'application auprès de YouTube :
 * sans elle le lecteur répond « erreur 153 ». Format demandé par YouTube : https + identifiant de l'application.
 */
export const EMBED_ORIGIN = `https://${APP_ID}`;

/** YouTube exige un lecteur d'au moins 200 × 200 px visible à l'écran. */
export const MIN_PLAYER_SIDE = 200;

/** Vidéos illisibles ici (privée, intégration refusée) qu'on saute d'affilée avant de renoncer. */
export const MAX_SKIPS = 10;
export const SKIP_DELAY_MS = 800;
/** Au-delà, sans réponse de YouTube, on annonce l'échec plutôt que d'attendre sans fin. */
export const LOAD_TIMEOUT_MS = 20_000;
/** Une playlist qui ne reboucle pas d'elle-même est relancée au début après ce délai. */
export const RESTART_DELAY_MS = 1500;

export type EmbedMessage = { type: 'failed'; code: string };

/** Message envoyé par la page du lecteur ; null pour tout ce qui n'en vient pas. */
export const parseEmbedMessage = (raw: string): EmbedMessage | null => {
  try {
    const data = JSON.parse(raw) as { type?: unknown; code?: unknown } | null;
    if (data !== null && typeof data === 'object' && data.type === 'failed') {
      return { type: 'failed', code: String(data.code ?? '') };
    }
  } catch {
    // pas un message de la page
  }
  return null;
};

/** Pourquoi le lecteur n'a pas pu lire la playlist, d'après le code d'erreur de YouTube. */
export const youtubeFailureText = (code: string): string => {
  switch (code) {
    case '100':
      return 'Cette vidéo est introuvable ou privée.';
    case '101':
    case '150':
      return 'Le propriétaire interdit la lecture hors de YouTube.';
    case '153':
      return 'YouTube a refusé de lire la vidéo dans l’application.';
    case 'network':
    case 'timeout':
      return 'YouTube ne répond pas. Vérifie ta connexion.';
    case 'crash':
      return 'Le lecteur s’est arrêté.';
    default:
      return 'YouTube n’a pas pu lire ce lien.';
  }
};

const HOSTS = /(^|\.)youtube\.com$|^youtu\.be$/;

/** Les liens touchés dans le lecteur ne s'ouvrent que s'ils mènent à YouTube. */
export const isYoutubeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && HOSTS.test(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
};

/**
 * Page du lecteur officiel de YouTube (API IFrame) pour une playlist ou une vidéo.
 * - `window.cadence.pause()` / `resume()` : l'application les appelle quand elle quitte l'écran ou revient, car YouTube interdit
 *   la lecture en arrière-plan. Rien ne joue tant que la page est suspendue, même si le lecteur démarre en retard.
 * - Saute les vidéos qui refusent l'intégration (codes 100, 101, 150), puis signale l'échec à l'application (`failed`).
 * - Une playlist repart du début quand elle se termine ; une vidéo seule se répète.
 */
export const youtubeEmbedHtml = (link: YoutubeLink): string => {
  const source = JSON.stringify({ kind: link.kind, id: link.id }).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body{margin:0;height:100%;background:#000;overflow:hidden}#player{width:100%;height:100%}</style>
</head>
<body>
<div id="player"></div>
<script>
(function () {
  var SOURCE = ${source};
  var MAX_SKIPS = ${MAX_SKIPS};
  var SKIP_DELAY = ${SKIP_DELAY_MS};
  var LOAD_TIMEOUT = ${LOAD_TIMEOUT_MS};
  var RESTART_DELAY = ${RESTART_DELAY_MS};
  var player = null;
  var ready = false;
  var state = -1;
  var suspended = document.hidden === true;
  var wasPlaying = false;
  var skips = 0;
  var failed = false;

  function send(message) {
    try { window.ReactNativeWebView.postMessage(JSON.stringify(message)); } catch (e) {}
  }
  function fail(code) {
    if (failed) return;
    failed = true;
    send({ type: 'failed', code: code });
  }
  function loop() {
    if (SOURCE.kind !== 'playlist') return;
    try { player.setLoop(true); } catch (e) {}
  }
  function suspend() {
    suspended = true;
    if (player && ready && (state === 1 || state === 3)) { wasPlaying = true; player.pauseVideo(); }
  }
  function resume() {
    suspended = false;
    if (player && ready && wasPlaying) { wasPlaying = false; player.playVideo(); }
  }

  window.cadence = { pause: suspend, resume: resume };
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) suspend(); else resume();
  });

  function onStateChange(event) {
    state = event.data;
    if (state === 1) {
      if (suspended) { wasPlaying = true; player.pauseVideo(); return; }
      skips = 0;
      loop();
    }
    if (state !== 0) return;
    if (SOURCE.kind === 'video') { player.seekTo(0, true); player.playVideo(); return; }
    // fin de la playlist : normalement le lecteur reboucle ; sinon on repart du premier titre
    setTimeout(function () {
      if (state === 0 && !suspended) player.playVideoAt(0);
    }, RESTART_DELAY);
  }

  function onError(event) {
    var code = event.data;
    var skippable = SOURCE.kind === 'playlist' && (code === 100 || code === 101 || code === 150);
    if (skippable && skips < MAX_SKIPS) {
      skips += 1;
      setTimeout(function () { player.nextVideo(); }, SKIP_DELAY);
      return;
    }
    fail(String(code));
  }

  window.onYouTubeIframeAPIReady = function () {
    var vars = { autoplay: 1, playsinline: 1, fs: 0, rel: 0, hl: 'fr' };
    var config = {
      width: '100%',
      height: '100%',
      playerVars: vars,
      events: {
        onReady: function () {
          ready = true;
          loop();
          if (suspended) wasPlaying = true; else player.playVideo();
        },
        onStateChange: onStateChange,
        onError: onError
      }
    };
    if (SOURCE.kind === 'playlist') { vars.listType = 'playlist'; vars.list = SOURCE.id; } else { config.videoId = SOURCE.id; }
    player = new YT.Player('player', config);
  };

  setTimeout(function () {
    if (!ready && !suspended) fail('timeout');
  }, LOAD_TIMEOUT);

  var script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  script.onerror = function () { fail('network'); };
  document.head.appendChild(script);
})();
</script>
</body>
</html>`;
};
