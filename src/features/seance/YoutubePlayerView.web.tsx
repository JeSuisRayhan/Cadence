import { StyleSheet, View } from 'react-native';
import { Text } from '../../components';
import type { YoutubePlayerViewProps } from './YoutubePlayerView';

/** Sur le web (aperçu de développement), le lecteur YouTube n'est pas disponible : seul l'emplacement est montré. */
export function YoutubePlayerView(_props: YoutubePlayerViewProps) {
  return (
    <View style={styles.box}>
      <Text variant="caption" tone="subtle" align="center">
        Lecteur YouTube : disponible dans l’application Android.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#000' },
});
