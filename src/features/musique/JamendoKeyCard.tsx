import { useState } from 'react';
import { Linking, StyleSheet, TextInput, View } from 'react-native';
import { Button, Card, Text } from '../../components';
import { colors, fonts } from '../../theme';

const PORTAL = 'https://devportal.jamendo.com';

export interface JamendoKeyCardProps {
  /** clé déjà enregistrée, si on la modifie */
  current?: string;
  onSave: (key: string) => void;
  onCancel?: () => void;
}

/** Saisie de la clé gratuite Jamendo, facultative : elle ajoute le catalogue Jamendo à celui d'Audius. */
export function JamendoKeyCard({ current = '', onSave, onCancel }: JamendoKeyCardProps) {
  const [value, setValue] = useState(current);
  const clean = value.trim();

  return (
    <Card radiusSize="panel" style={styles.card}>
      <Text variant="rowTitle">Ajoute Jamendo pour plus de choix</Text>
      <Text variant="caption" tone="muted" style={styles.help}>
        Ta playlist se compose déjà avec Audius, sans clé. Avec une clé gratuite, Cadence pioche aussi dans la musique libre de Jamendo :
        crée un compte gratuit sur son portail développeurs, copie ta clé (« client id ») et colle-la ici.
      </Text>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder="Colle ta clé Jamendo"
        placeholderTextColor={colors.textDisabled}
        autoCapitalize="none"
        autoCorrect={false}
        spellCheck={false}
        returnKeyType="done"
        onSubmitEditing={() => clean && onSave(clean)}
        accessibilityLabel="Clé Jamendo"
        style={styles.input}
      />
      <View style={styles.actions}>
        <Button label="Enregistrer la clé" size="md" disabled={clean.length === 0} onPress={() => onSave(clean)} style={styles.grow} />
        {onCancel ? <Button label="Annuler" size="md" variant="outline" onPress={onCancel} /> : null}
      </View>
      <Button
        label="Obtenir une clé gratuite"
        size="md"
        variant="quiet"
        icon="external"
        iconPosition="left"
        onPress={() => void Linking.openURL(PORTAL)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, gap: 10 },
  help: { marginTop: -4 },
  input: {
    height: 52,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderCurve: 'continuous',
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 15,
  },
  actions: { flexDirection: 'row', gap: 8 },
  grow: { flex: 1 },
});
