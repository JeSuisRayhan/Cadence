import { ScrollView, StyleSheet } from 'react-native';
import { ImageTile, Text } from '../../components';
import { coverImages } from '../../assets/images';
import { GENRES } from '../../music/genres';
import type { GenreId } from '../../music/types';
import { screenPadding } from '../../theme';

export interface GenreTilesProps {
  value: readonly GenreId[];
  onChange: (next: GenreId[]) => void;
}

/** Les styles aimés : au moins un reste toujours choisi. */
export function GenreTiles({ value, onChange }: GenreTilesProps) {
  const toggle = (id: GenreId) => {
    if (value.includes(id)) {
      if (value.length > 1) onChange(value.filter((g) => g !== id));
    } else {
      onChange(GENRES.map((g) => g.id).filter((g) => g === id || value.includes(g)));
    }
  };

  return (
    <ScrollView
      horizontal
      accessibilityRole="menu"
      accessibilityLabel="Styles musicaux"
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      {GENRES.map((genre) => (
        <ImageTile
          key={genre.id}
          source={coverImages[genre.cover]}
          selected={value.includes(genre.id)}
          onPress={() => toggle(genre.id)}
          label={genre.label}
          style={styles.tile}
          contentStyle={styles.label}
          dim={0.45}
        >
          <Text variant="bodySemi" style={styles.name} numberOfLines={1}>
            {genre.label}
          </Text>
        </ImageTile>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // la rangée déborde sur les marges de l'écran, comme dans la maquette
  scroll: { marginHorizontal: -screenPadding, flexGrow: 0 },
  row: { gap: 10, paddingHorizontal: screenPadding },
  tile: { width: 104, height: 104 },
  label: { position: 'absolute', left: 10, right: 8, bottom: 8 },
  name: { fontSize: 14, lineHeight: 18 },
});
