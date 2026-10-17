import { Tabs, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, StyleSheet } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="decks"
        options={{
          title: 'Decks',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'rectangle.stack.fill', android: 'layers', web: 'layers' }}
              tintColor={color}
              size={24}
            />
          ),
          headerRight: () => (
            <Pressable style={styles.importBtn} onPress={() => router.push('/import' as never)}>
              <Text style={styles.importBtnText}>Import</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  importBtn: {
    marginRight: 16,
  },
  importBtnText: {
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: '600',
  },
});
