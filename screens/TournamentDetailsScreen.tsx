import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, StyleSheet, View, StatusBar } from 'react-native';
import { getMatchesByTournamentId } from '../db'; // funkcja pobierająca mecze po id turnieju

export default function TournamentDetailsScreen({ route }) {
  const { tournamentId, tournamentPlace } = route.params;
  const [matches, setMatches] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await getMatchesByTournamentId(tournamentId);
      setMatches(data);
    };
    load();
  }, [tournamentId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Turniej: {tournamentPlace}</Text>
      <FlatList
        data={matches}
        keyExtractor={item => item.id}        renderItem={({ item }) => (
          <View style={styles.matchRow}>
            <Text style={styles.matchHeader}>Mecz #{item.match_order}</Text>
            <View style={styles.playersContainer}>
              <Text style={styles.playersText}>
                {item.playersInfo?.[0]?.name || 'Gracz 1'} ({item.playersInfo?.[0]?.nick || 'N/A'})
              </Text>
              <Text style={styles.vsText}>VS</Text>
              <Text style={styles.playersText}>
                {item.playersInfo?.[1]?.name || 'Gracz 2'} ({item.playersInfo?.[1]?.nick || 'N/A'})
              </Text>
            </View>
            <Text style={styles.resultText}>
              Wynik: {(item.team1_wins !== undefined && item.team2_wins !== undefined)
                ? `${item.team1_wins}:${item.team2_wins}`
                : 'Brak wyniku'}
            </Text>
            {item.winner_team_number && (
              <Text style={styles.winnerText}>
                Zwycięzca: {item.playersInfo?.[item.winner_team_number - 1]?.name || `Zespół ${item.winner_team_number}`}
              </Text>
            )}
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
  matchHeader: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#333', 
    marginBottom: 8 
  },
  playersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  playersText: { 
    fontSize: 14, 
    color: '#555',
    flex: 1,
    textAlign: 'center'
  },
  vsText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#007a32',
    marginHorizontal: 10
  },
  resultText: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  winnerText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#007a32',
    textAlign: 'center'
  },
  matchInfo: { fontSize: 16, color: '#333' },
  emptyList: { color: '#bbb', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});
