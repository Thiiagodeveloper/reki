import { Tabs, router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { View, Pressable, Text, StyleSheet } from 'react-native';

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
            <View style={styles.headerButtons}>
              <Pressable style={styles.headerBtn} onPress={() => router.push('/search' as never)}>
                <Text style={styles.headerBtnText}>Search</Text>
              </Pressable>
              <Pressable style={styles.headerBtn} onPress={() => router.push('/import' as never)}>
                <Text style={styles.headerBtnText}>Import</Text>
              </Pressable>
            </View>
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
  headerButtons: {
    flexDirection: 'row',
    gap: 16,
    marginRight: 16,
  },
  headerBtn: {},
  headerBtnText: {
    color: '#6C5CE7',
    fontSize: 15,
    fontWeight: '600',
  },
});
