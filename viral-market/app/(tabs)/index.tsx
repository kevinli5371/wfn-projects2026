import { StyleSheet, View, Text } from 'react-native';

export default function PortfolioScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Portfolio ($1,000)</Text>
      <Text style={styles.subtitle}>You have no active investments.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold' },
  subtitle: { fontSize: 16, color: 'gray', marginTop: 10 },
});