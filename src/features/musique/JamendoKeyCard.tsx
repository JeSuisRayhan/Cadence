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

/** Saisie de la clé gratuite Jamendo, nécessaire pour composer la playlist dans l'application. */
export function JamendoKeyCard({ current = '', onSave, onCancel }: JamendoKeyCardProps) {
  const [value, setValue] = useState(current);
  const clean = value.trim();

  return (
    <Card radiusSize="panel" style={styles.card}>
      <Text variant="rowTitle">Une clé gratuite pour composer ta playlist</Text>
      <Text variant="caption" tone="muted" style={styles.help}>
        Cadence compose la playlist avec la musique libre de Jamendo. Crée un compte gratuit sur le portail développeurs de Jamendo,
        copie ta clé (« client id ») et colle-la ici.
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
