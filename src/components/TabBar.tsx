import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, sizes } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const ICONS: Record<string, IconName> = {
  index: 'dumbbell',
  programmes: 'calendar',
  reglages: 'sliders',
};

/** Barre d'onglets de la maquette : trois entrées, braise pour l'onglet actif. */
export function TabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  return (
    <View
      accessibilityRole="tablist"
      style={[styles.bar, { height: sizes.tabBar + insets.bottom, paddingBottom: insets.bottom }]}
    >
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const color = focused ? colors.ember : colors.textSubtle;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            style={styles.item}
          >
            <Icon name={ICONS[route.name] ?? 'dumbbell'} size={24} color={color} />
            <Text variant="microSemi" tone={focused ? 'ember' : 'subtle'} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  item: { flex: 1, alignItems: 'center', gap: 4, paddingTop: 6 },
});
