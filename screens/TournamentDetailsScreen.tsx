import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, StyleSheet, View, StatusBar } from 'react-native';
import { getMatchesByTournamentId } from '../db'; // funkcja pobierająca mecze po id turnieju

export default function TournamentDetailsScreen({ route }) {
  const { tournamentId, tournamentPlace } = route.params;
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getMatchesByTournamentId(tournamentId);
        // Usuń duplikaty po match_id
    const uniqueMatches = Array.from(
    new Map(data.map((m: any) => [m.match_id, m])).values()
    );
    setMatches(uniqueMatches);
    };
    load();
  }, [tournamentId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Turniej: {tournamentPlace}</Text>
      <FlatList
        data={matches}
        keyExtractor={item => item.match_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.matchRow}>
            <Text style={styles.matchInfo}>
                Mecz #{item.match_order} • Wynik: 
                {(item.team1_wins !== null && item.team2_wins !== null)
                    ? `${item.team1_wins}:${item.team2_wins}`
                    : 'brak wyniku'}
            </Text>
            {/* Możesz dodać szczegóły graczy, wyników itd. */}
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>Brak meczów w tym turnieju.</Text>}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, flexGrow: 1 },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#222', textAlign: 'center' },
  matchRow: {
    backgroundColor: '#f3f6fa',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  matchInfo: { fontSize: 16, color: '#333' },
  emptyList: { color: '#bbb', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});
