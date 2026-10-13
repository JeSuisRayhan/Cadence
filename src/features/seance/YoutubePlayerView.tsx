import { useEffect, useMemo, useRef } from 'react';
import { AppState, Linking, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { YoutubeLink } from '../../music/youtube';
import { EMBED_ORIGIN, isYoutubeUrl, parseEmbedMessage, youtubeEmbedHtml } from '../../music/youtubeEmbed';

export interface YoutubePlayerViewProps {
  link: YoutubeLink;
  /** le lecteur n'a pas pu lire : code d'erreur de YouTube, ou « network », « timeout », « crash » */
  onFailed: (code: string) => void;
}

const openIfYoutube = (url: string): void => {
  if (isYoutubeUrl(url)) void Linking.openURL(url);
};

/**
 * Le lecteur officiel de YouTube, dans une WebView. Elle reste visible en entier tant que la musique joue.
 * YouTube interdit la lecture en arrière-plan : le lecteur est mis en pause dès que l'application quitte l'écran, et repart au retour.
 */
export function YoutubePlayerView({ link, onFailed }: YoutubePlayerViewProps) {
  const web = useRef<WebView>(null);
  // `baseUrl` : YouTube reconnaît l'application à cette adresse (sinon le lecteur répond « erreur 153 »)
  const source = useMemo(() => ({ html: youtubeEmbedHtml(link), baseUrl: EMBED_ORIGIN }), [link]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      const action = status === 'active' ? 'resume' : 'pause';
      web.current?.injectJavaScript(`window.cadence&&window.cadence.${action}();true;`);
    });
    return () => subscription.remove();
  }, []);

  const onMessage = (event: WebViewMessageEvent): void => {
    const message = parseEmbedMessage(event.nativeEvent.data);
    if (message) onFailed(message.code);
  };

  return (
    <WebView
      ref={web}
      source={source}
      style={styles.web}
      originWhitelist={['https://*']}
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo={false}
      setBuiltInZoomControls={false}
      onMessage={onMessage}
      onRenderProcessGone={() => onFailed('crash')}
      // un lien touché dans le lecteur (titre, logo YouTube) s'ouvre dans YouTube, jamais dans le lecteur lui-même
      onOpenWindow={(event) => openIfYoutube(event.nativeEvent.targetUrl)}
      onShouldStartLoadWithRequest={(request) => {
        if (request.url === 'about:blank' || request.url.startsWith(EMBED_ORIGIN)) return true;
        openIfYoutube(request.url);
        return false;
      }}
    />
  );
}

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: '#000' },
});
