import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, screenPadding } from '../theme';

export interface ScreenProps {
  children?: ReactNode;
  /** zone fixe en haut (bouton retour, étapes) */
  header?: ReactNode;
  /** zone fixe en bas (bouton principal) */
  footer?: ReactNode;
  /** le contenu défile */
  scroll?: boolean;
  /** pas de marge latérale (images pleine largeur) */
  bleed?: boolean;
  /** l'écran est sous la barre d'onglets : pas de marge basse */
  tabs?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}

/** Cadre commun des écrans : fond, zones sûres, en-tête et pied de page fixes. */
export function Screen({ children, header, footer, scroll = false, bleed = false, tabs = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets.top, 12) + 10;
  const bottom = Math.max(insets.bottom, 12) + 16;

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        !bleed && styles.padded,
        // sans pied de page ni barre d'onglets, le contenu défile jusqu'en bas avec la marge de sécurité
        { paddingBottom: footer || tabs ? 24 : bottom },
        contentStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, !bleed && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {header ? <View style={styles.padded}>{header}</View> : null}
      {body}
      {footer ? <View style={[styles.padded, { paddingBottom: bottom, paddingTop: 12 }]}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  padded: { paddingHorizontal: screenPadding },
});
