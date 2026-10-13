import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Icon, Segmented, Text } from '../../components';
import { EXTERNAL_APPS, externalQuery } from '../../music/external';
import type { AutoEngine, ExternalApp, GenreId } from '../../music/types';
import { colors } from '../../theme';

export interface EngineChoiceProps {
  engine: AutoEngine;
  app: ExternalApp;
  genres: readonly GenreId[];
  onEngine: (engine: AutoEngine) => void;
  onApp: (app: ExternalApp) => void;
}

/** Où se joue la playlist automatique : dans Cadence, ou dans l'application musicale de la personne. */
export function EngineChoice({ engine, app, genres, onEngine, onApp }: EngineChoiceProps) {
  return (
    <View>
      <Segmented
        look="tab"
        accessibilityLabel="Lecture de la playlist"
        value={engine}
        onChange={onEngine}
        options={[
          { value: 'inapp', label: 'Dans Cadence' },
          { value: 'external', label: 'Mon application' },
        ]}
      />
      {engine === 'external' ? (
        <Card radiusSize="card" style={styles.apps}>
          {EXTERNAL_APPS.map((item, index) => {
            const selected = item.id === app;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => onApp(item.id)}
                style={({ pressed }) => [styles.app, index > 0 && styles.appBorder, pressed && styles.pressed]}
              >
                <Text variant="bodySemi" style={styles.appName}>
                  {item.label}
                </Text>
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <Icon name="check" size={13} color={colors.onEmber} strokeWidth={3.2} /> : null}
                </View>
              </Pressable>
            );
          })}
        </Card>
      ) : null}
      {engine === 'external' ? (
        <Text variant="caption" tone="subtle" style={styles.note}>
          Au début de la séance, Cadence ouvre ton application avec la recherche « {externalQuery(genres)} ». La lecture se fait
          là-bas : reviens dans Cadence pour suivre ta séance.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  apps: { marginTop: 10 },
  app: { flexDirection: 'row', alignItems: 'center', height: 54, paddingHorizontal: 16 },
  appBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  appName: { flex: 1 },
  pressed: { backgroundColor: 'rgba(255,255,255,0.03)' },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  radioOn: { borderWidth: 0, backgroundColor: colors.ember },
  note: { marginTop: 10, paddingHorizontal: 4 },
});
