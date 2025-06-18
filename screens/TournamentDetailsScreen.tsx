import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, StyleSheet, View, StatusBar, TouchableOpacity } from 'react-native';
import { getMatchesByTournamentId } from '../db'; // funkcja pobierająca mecze po id turnieju

export default function TournamentDetailsScreen({ route }) {
  const { tournamentId, tournamentPlace } = route.params;
  const [matches, setMatches] = useState<any[]>([]);
  const [isDebel, setIsDebel] = useState(false);
  const [showTable, setShowTable] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getMatchesByTournamentId(tournamentId);
      setMatches(data);
      // Sprawdź czy to debel na podstawie obecności teamsInfo w pierwszym meczu
      if (data.length > 0 && data[0].teamsInfo && data[0].teamsInfo.length === 2) {
        setIsDebel(true);
      } else {
        setIsDebel(false);
      }
    };
    load();
  }, [tournamentId]);

  // Funkcja do generowania tabeli wyników
  function getRanking() {
    if (matches.length === 0) return [];
    if (isDebel) {
      // Ranking drużyn
      const teamStats: Record<string, { name: string; wins: number; games: number }> = {};
      matches.forEach((m) => {
        if (m.teamsInfo && m.teamsInfo.length === 2 && m.winner_team_number) {
          m.teamsInfo.forEach((teamName: string, idx: number) => {
            if (!teamStats[teamName]) teamStats[teamName] = { name: teamName, wins: 0, games: 0 };
            teamStats[teamName].games++;
            if (m.winner_team_number === idx + 1) teamStats[teamName].wins++;
          });
        }
      });
      return Object.values(teamStats).sort((a, b) => b.wins - a.wins);
    } else {
      // Ranking graczy
      const playerStats: Record<string, { name: string; wins: number; games: number }> = {};
      matches.forEach((m) => {
        if (m.playersInfo && m.playersInfo.length === 2 && m.winner_team_number) {
          m.playersInfo.forEach((p: any, idx: number) => {
            if (!playerStats[p.name]) playerStats[p.name] = { name: p.name, wins: 0, games: 0 };
            playerStats[p.name].games++;
            if (m.winner_team_number === idx + 1) playerStats[p.name].wins++;
          });
        }
      });
      return Object.values(playerStats).sort((a, b) => b.wins - a.wins);
    }
  }

  const ranking = getRanking();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Turniej: {tournamentPlace}</Text>
      {isDebel && <Text style={styles.debelLabel}>debel</Text>}
      {!isDebel && <Text style={styles.debelLabel}>singiel</Text>}
      <TouchableOpacity style={styles.switchButton} onPress={() => setShowTable((v) => !v)}>
        <Text style={styles.switchButtonText}>{showTable ? 'Pokaż mecze' : 'Pokaż tabelę wyników'}</Text>
      </TouchableOpacity>
      {showTable ? (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, { flex: 2 }]}>#</Text>
            <Text style={[styles.tableCell, { flex: 8 }]}> {isDebel ? 'Drużyna' : 'Gracz'} </Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>Wygrane</Text>
            <Text style={[styles.tableCell, { flex: 3 }]}>Mecze</Text>
          </View>
          {ranking.length === 0 && <Text style={styles.emptyList}>Brak wyników do wyświetlenia.</Text>}
          {ranking.map((row, idx) => (
            <View key={row.name} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{idx + 1}</Text>
              <Text style={[styles.tableCell, { flex: 8 }]}>{row.name}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{row.wins}</Text>
              <Text style={[styles.tableCell, { flex: 3 }]}>{row.games}</Text>
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={styles.matchRow}>
              <Text style={styles.matchHeader}>Mecz #{item.match_order}</Text>
              <View style={styles.playersContainer}>
                {item.teamsInfo && item.teamsInfo.length === 2 ? (
                  <>
                    <Text style={styles.playersText}>{item.teamsInfo[0]}</Text>
                    <Text style={styles.vsText}>VS</Text>
                    <Text style={styles.playersText}>{item.teamsInfo[1]}</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.playersText}>
                      {item.playersInfo?.[0]?.name || 'Gracz 1'} ({item.playersInfo?.[0]?.nick || 'N/A'})
                    </Text>
                    <Text style={styles.vsText}>VS</Text>
                    <Text style={styles.playersText}>
                      {item.playersInfo?.[1]?.name || 'Gracz 2'} ({item.playersInfo?.[1]?.nick || 'N/A'})
                    </Text>
                  </>
                )}
              </View>
              <Text style={styles.resultText}>
                Wynik: {(item.team1_wins !== undefined && item.team2_wins !== undefined)
                  ? `${item.team1_wins}:${item.team2_wins}`
                  : 'Brak wyniku'}
              </Text>
              {item.winner_team_number && (
                <Text style={styles.winnerText}>
                  {isDebel ? 'Zwycięzcy: ' : 'Zwycięzca: '}
                  {item.teamsInfo && item.teamsInfo.length === 2
                    ? item.teamsInfo[item.winner_team_number - 1]
                    : (item.playersInfo?.[item.winner_team_number - 1]?.name || `Zespół ${item.winner_team_number}`)}
                </Text>
              )}
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyList}>Brak meczów w tym turnieju.</Text>}
          contentContainerStyle={styles.container}
        />
      )}
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
  debelLabel: {
    fontSize: 13,
    color: '#007a32',
    textAlign: 'center',
    marginBottom: 8,
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  switchButton: {
    backgroundColor: '#4682b4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginBottom: 12,
  },
  switchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  tableContainer: {
    backgroundColor: '#f3f6fa',
    borderRadius: 10,
    marginBottom: 18,
    padding: 10,
    elevation: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
    paddingBottom: 4,
    marginBottom: 6,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderColor: '#e0e0e0',
    paddingVertical: 3,
  },
  tableCell: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
});
