import { Image } from 'expo-image';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { coverImages } from '../../assets/images';
import { Card, Icon, SectionTitle, Text, type IconName } from '../../components';
import { plural } from '../../domain/format';
import { deleteImportedFile, importMusicFiles } from '../../music/localImport';
import type { LocalTrack } from '../../music/types';
import { parseYoutubeLink } from '../../music/youtube';
import { useAppStore } from '../../store';
import { colors, fonts } from '../../theme';

const formatOf = (track: LocalTrack): string => {
  const extension = track.uri.split('.').pop()?.toUpperCase() ?? '';
  return extension && extension.length <= 4 ? extension : track.kind === 'video' ? 'MP4' : 'Audio';
};

/** Mode manuel : tes fichiers MP3/MP4 et/ou ta playlist YouTube. */
export function ManualPanel() {
  const files = useAppStore((s) => s.music.files);
  const youtubeUrl = useAppStore((s) => s.music.youtubeUrl);
  const setMusic = useAppStore((s) => s.setMusic);

  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const savedLink = youtubeUrl ? parseYoutubeLink(youtubeUrl) : null;
  const count = files.length + (savedLink ? 1 : 0);

  const addFiles = async () => {
    if (importing) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const imported = await importMusicFiles();
      if (imported.length > 0) setMusic({ files: [...files, ...imported] });
    } catch {
      setImportMessage('L’import n’a pas fonctionné sur cet appareil.');
    } finally {
      setImporting(false);
    }
  };

  const addLink = () => {
    const parsed = parseYoutubeLink(link);
    if (!parsed) {
      setLinkError('Ce lien n’est pas une playlist YouTube.');
      return;
    }
    setMusic({ youtubeUrl: parsed.url });
    setLink('');
    setLinkError(null);
  };

  const removeFile = (track: LocalTrack) => {
    deleteImportedFile(track);
    setMusic({ files: files.filter((f) => f.id !== track.id) });
  };

  return (
    <View>
      <View style={styles.section}>
        <SectionTitle title="Importer" />
        <View style={styles.imports}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Importer des fichiers"
            accessibilityState={{ busy: importing }}
            onPress={() => void addFiles()}
            style={({ pressed }) => [styles.importRow, pressed && styles.pressed]}
          >
            <IconBadge icon="upload" />
            <View style={styles.grow}>
              <Text variant="rowTitle">Importer des fichiers</Text>
              <Text variant="caption" tone="subtle">
                {importing ? 'Import en cours…' : 'MP3 ou MP4 depuis ton téléphone'}
              </Text>
            </View>
            <Icon name="plus" size={22} color={colors.textSubtle} />
          </Pressable>
          {importMessage ? (
            <Text variant="caption" tone="danger" style={styles.error}>
              {importMessage}
            </Text>
          ) : null}

          <View style={styles.importRow}>
            <IconBadge icon="youtube" />
            <View style={styles.grow}>
              <Text variant="caption" tone="subtle">
                Playlist YouTube
              </Text>
              <TextInput
                value={link}
                onChangeText={(text) => {
                  setLink(text);
                  setLinkError(null);
                }}
                placeholder="Colle le lien de la playlist"
                placeholderTextColor={colors.textDisabled}
                accessibilityLabel="Lien de la playlist YouTube"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={addLink}
                style={styles.input}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ajouter la playlist YouTube"
              onPress={addLink}
              style={({ pressed }) => [styles.add, pressed && styles.pressed]}
            >
              <Text variant="buttonSm" tone="onEmber">
                Ajouter
              </Text>
            </Pressable>
          </View>
          {linkError ? (
            <Text variant="caption" tone="danger" style={styles.error}>
              {linkError}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title="Ma playlist" right={count === 0 ? undefined : plural(count, 'élément', 'éléments')} />
        <Card radiusSize="card" style={styles.list}>
          {savedLink ? (
            <Row
              first
              title="Playlist YouTube"
              sub="Lue dans l’appli pendant la séance"
              cover={<Image source={coverImages.ytmix} style={styles.cover} contentFit="cover" />}
              removeLabel="Retirer la playlist YouTube"
              onRemove={() => setMusic({ youtubeUrl: null })}
            />
          ) : null}
          {files.map((track, index) => (
            <Row
              key={track.id}
              first={!savedLink && index === 0}
              title={track.name}
              sub={`${formatOf(track)}${track.kind === 'video' ? ' · vidéo' : ''}`}
              cover={
                <View style={[styles.cover, styles.coverIcon]}>
                  <Icon
                    name={track.kind === 'video' ? 'video' : 'music'}
                    size={20}
                    color={track.kind === 'video' ? colors.ice : colors.ember}
                  />
                </View>
              }
              removeLabel={`Retirer ${track.name}`}
              onRemove={() => removeFile(track)}
            />
          ))}
          {count === 0 ? (
            <View style={styles.empty}>
              <Text variant="meta" tone="subtle">
                Aucun titre pour l’instant
              </Text>
            </View>
          ) : null}
        </Card>
        {files.length > 0 && savedLink ? (
          <Text variant="caption" tone="subtle" style={styles.note}>
            Cadence lit tes fichiers dans l’application. La playlist YouTube ne se lit que s’il n’y a aucun fichier.
          </Text>
        ) : savedLink ? (
          <Text variant="caption" tone="subtle" style={styles.note}>
            La playlist se lit en bas de l’écran de séance : tu gardes l’appli sous la main. YouTube l’arrête dès que tu quittes l’appli ou
            verrouilles l’écran. Pour de la musique écran éteint, importe des fichiers ou choisis le mode automatique.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function IconBadge({ icon }: { icon: IconName }) {
  return (
    <View style={styles.badge}>
      <Icon name={icon} size={22} color={colors.ember} />
    </View>
  );
}

function Row({
  title,
  sub,
  cover,
  removeLabel,
  onRemove,
  first,
}: {
  title: string;
  sub: string;
  cover: ReactNode;
  removeLabel: string;
  onRemove: () => void;
  first: boolean;
}) {
  return (
    <View style={[styles.row, !first && styles.rowBorder]}>
      {cover}
      <View style={styles.grow}>
        <Text variant="bodySemi" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="caption" tone="subtle" numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={removeLabel} onPress={onRemove} style={styles.remove}>
        <Icon name="close" size={20} color={colors.textSubtle} strokeWidth={1.9} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 22 },
  imports: { marginTop: 10, gap: 8 },
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 72,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderCurve: 'continuous',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.emberTint,
  },
  grow: { flex: 1, minWidth: 0 },
  input: { padding: 0, color: colors.text, fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  add: {
    width: 84,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
  error: { paddingHorizontal: 6, marginTop: -2 },
  list: { marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 64, paddingLeft: 10, paddingRight: 4 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  cover: { width: 44, height: 44, borderRadius: 12, borderCurve: 'continuous', backgroundColor: colors.surfaceRaised },
  coverIcon: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  remove: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { height: 64, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 10, paddingHorizontal: 4 },
});
