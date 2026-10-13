import { Tabs } from 'expo-router/js-tabs';
import { TabBar } from '../../components/TabBar';
import { colors } from '../../theme';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg } }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
      <Tabs.Screen name="programmes" options={{ title: 'Programmes' }} />
      <Tabs.Screen name="reglages" options={{ title: 'Réglages' }} />
    </Tabs>
  );
}
