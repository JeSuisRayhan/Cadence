import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { colors, screenPadding } from '../theme';
import { Button } from './Button';
import { Text } from './Text';

export interface ConfirmSheetProps {
  visible: boolean;
  title: string;
  message?: string;
  /** l'action sûre, mise en avant (rester, annuler) */
  safeLabel: string;
  /** l'action à confirmer (quitter, supprimer) */
  confirmLabel: string;
  onSafe: () => void;
  onConfirm: () => void;
  /** une troisième voie, entre les deux (« Terminer et enregistrer ») */
  extra?: { label: string; onPress: () => void };
}

/** Boîte de confirmation : l'action sûre est en braise, l'action risquée en texte. */
export function ConfirmSheet({ visible, title, message, safeLabel, confirmLabel, onSafe, onConfirm, extra }: ConfirmSheetProps) {
  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent onRequestClose={onSafe}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel={safeLabel} style={StyleSheet.absoluteFill} onPress={onSafe} />
        <View accessibilityViewIsModal style={styles.card}>
          <Text variant="h2" accessibilityRole="header">
            {title}
          </Text>
          {message ? (
            <Text variant="body" tone="muted" style={styles.message}>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button label={safeLabel} onPress={onSafe} />
            {extra ? <Button label={extra.label} variant="outline" onPress={extra.onPress} /> : null}
            <Button label={confirmLabel} variant="danger" onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: screenPadding,
    backgroundColor: 'rgba(12,13,15,0.78)',
  },
  card: {
    padding: 22,
    borderRadius: 28,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  message: { marginTop: 8 },
  actions: { marginTop: 20, gap: 8 },
});
