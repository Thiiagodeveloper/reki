import { StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stats</Text>
      <Text style={styles.subtitle}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D3436',
  },
  subtitle: {
    fontSize: 14,
    color: '#636E72',
    marginTop: 8,
  },
});
