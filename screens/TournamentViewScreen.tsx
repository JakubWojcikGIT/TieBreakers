// screens/TournamentViewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button, FlatList, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { getMatchesForTournament, updateMatchResult, addTournamentWithMatches, getPlayers, addDebelTournamentWithMatches } from '../db';
import type { Player } from '../db';

export default function TournamentViewScreen({ route, navigation }: any) {
  const { tournamentId, tournamentData } = route.params;
  const [matches, setMatches] = useState<any[]>([]);
  const [results, setResults] = useState<{ [key: string]: { team1: string, team2: string } }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tournamentData?.type === 'debel' && tournamentData?.teams) {
      generateMatchesFromTeams(tournamentData.teams, tournamentData.roundsToWin);
    } else if (tournamentId) {
      // Jeśli mamy ID turnieju, to załaduj mecze z bazy
      loadMatchesFromDatabase();
    } else {
      // Jeśli mamy dane turnieju, to wygeneruj mecze lokalnie
      generateMatchesLocally();
    }
  }, []);

  async function loadMatchesFromDatabase() {
    setLoading(true);
    const data = await getMatchesForTournament(tournamentId);
    setMatches(data);
    const initialResults: any = {};
    data.forEach((m: any) => {
      initialResults[m.id] = {
        team1: m.team1_wins?.toString() ?? '',
        team2: m.team2_wins?.toString() ?? '',
      };
    });
    setResults(initialResults);
    setLoading(false);
  }
  // --- Algorytm Round Robin (circle method) ---
  function generateRoundRobinSchedule(players: Player[]) {
    const n = players.length;
    const isOdd = n % 2 !== 0;
    const playerList = isOdd ? [...players, { id: 'bye', name: 'wolny los' }] : [...players];
    const rounds = playerList.length - 1;
    const half = playerList.length / 2;
    const schedule = [];
    for (let round = 0; round < rounds; round++) {
      const matches = [];
      for (let i = 0; i < half; i++) {
        const p1 = playerList[i];
        const p2 = playerList[playerList.length - 1 - i];
        if (p1.id !== 'bye' && p2.id !== 'bye') {
          matches.push([p1, p2]);
        }
      }
      schedule.push(matches);
      // rotate
      playerList.splice(1, 0, playerList.pop());
    }
    return schedule;
  }
  async function generateMatchesLocally() {
    setLoading(true);
    try {
      const { playerIds, roundsToWin } = tournamentData;
      const playersSnapshot: Player[] = await getPlayers();
      const playersData: Player[] = playerIds.map((playerId: string) => {
        const player = playersSnapshot.find((p) => p.id === playerId);
        if (player) {
          return player;
        }
        // fallback dummy player (should not happen)
        return {
          id: playerId,
          first_name: 'Gracz',
          last_name: '',
          nick_name: 'N/A',
          created_at: '',
        } as Player;
      });
      // --- Użyj Round Robin ---
      const schedule = generateRoundRobinSchedule(playersData);
      const localMatches = [];
      let matchOrder = 1;
      schedule.forEach((round, roundIdx) => {
        round.forEach(([p1, p2]) => {
          const tempId = `temp_${p1.id}_${p2.id}`;
          localMatches.push({
            id: tempId,
            match_order: matchOrder++,
            players: [p1.id, p2.id],
            roundsToWin: roundsToWin,
            playersInfo: [p1, p2],
            round: roundIdx + 1,
          });
        });
      });
      setMatches(localMatches);
      const initialResults = {};
      localMatches.forEach((m) => {
        initialResults[m.id] = { team1: '', team2: '' };
      });
      setResults(initialResults);
    } catch (e) {
      console.error('Błąd generowania meczów lokalnie:', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć turnieju');
    }
    setLoading(false);
  }

  async function generateMatchesFromTeams(teams, roundsToWin) {
    setLoading(true);
    try {
      const localMatches = [];
      let matchOrder = 1;

      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const tempId = `temp_${i}_${j}`;
          const match = {
            id: tempId,
            match_order: matchOrder++,
            teams: [teams[i], teams[j]],
            roundsToWin,
          };
          localMatches.push(match);
        }
      }

      setMatches(localMatches);
      const initialResults = {};
      localMatches.forEach((m) => {
        initialResults[m.id] = {
          team1: '',
          team2: '',
        };
      });
      setResults(initialResults);
    } catch (e) {
      console.error('Błąd generowania meczów z drużyn:', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć drabinki');
    }
    setLoading(false);
  }

  function handleChange(matchId: string, team: 'team1' | 'team2', value: string) {
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  }
  function validateMatchResult(team1Wins: number, team2Wins: number, roundsToWin: number): boolean {
    // Sprawdź czy liczby są nieujemne
    if (team1Wins < 0 || team2Wins < 0) {
      return false;
    }

    // Sprawdź czy któryś z graczy osiągnął wymaganą liczbę wygranych
    const maxWins = roundsToWin;
    
    // Poprawny wynik to taki, gdy:
    // - pierwszy gracz wygrał dokładnie wymaganą liczbę rund, a drugi mniej
    // - drugi gracz wygrał dokładnie wymaganą liczbę rund, a pierwszy mniej
    // - lub obaj gracze mają mniej niż wymagana liczba rund (mecz w trakcie)
    const isValid =
      (team1Wins === maxWins && team2Wins < maxWins) ||
      (team2Wins === maxWins && team1Wins < maxWins) ||
      (team1Wins < maxWins && team2Wins < maxWins);

    return isValid;
  }
  async function saveResults() {
    try {
      setLoading(true);
      // Sprawdź, czy wszystkie wyniki są poprawne
      for (const match of matches) {
        const res = results[match.id];
        if (res.team1 !== '' && res.team2 !== '') {
          const team1Wins = parseInt(res.team1);
          const team2Wins = parseInt(res.team2);
          if (!validateMatchResult(team1Wins, team2Wins, match.roundsToWin)) {
            Alert.alert('Błąd', `Niepoprawny wynik dla meczu ${match.match_order}`);
            setLoading(false);
            return;
          }
        }
      }
      let finalTournamentId = tournamentId;
      // Jeśli jest to nowy turniej (mamy tournamentData), najpierw go utwórz
      if (tournamentData && !tournamentId) {
        if (tournamentData.type === 'debel') {
          // Debel: utwórz turniej i mecze drużynowe
          const { place, teams, roundsToWin } = tournamentData;
          finalTournamentId = await addDebelTournamentWithMatches(place, teams, roundsToWin);
          // Pobierz utworzone mecze
          const createdMatches = await getMatchesForTournament(finalTournamentId);
          // Dopasuj lokalne mecze do ID z bazy danych
          for (let i = 0; i < matches.length; i++) {
            const localMatch = matches[i];
            const dbMatch = createdMatches.find(m =>
              m.match_order === localMatch.match_order &&
              m.teams && localMatch.teams &&
              m.teams[0].players.join() === localMatch.teams[0].players.join() &&
              m.teams[1].players.join() === localMatch.teams[1].players.join()
            );
            if (dbMatch && results[localMatch.id]) {
              results[dbMatch.id] = results[localMatch.id];
            }
          }
          setMatches(createdMatches);
        } else {
          // Singiel: domyślna logika
          const { place, playerIds, roundsToWin } = tournamentData;
          finalTournamentId = await addTournamentWithMatches(place, playerIds, roundsToWin);
          const createdMatches = await getMatchesForTournament(finalTournamentId);
          for (let i = 0; i < matches.length; i++) {
            const localMatch = matches[i];
            const dbMatch = createdMatches.find(m =>
              m.match_order === localMatch.match_order &&
              m.players.includes(localMatch.players[0]) &&
              m.players.includes(localMatch.players[1])
            );
            if (dbMatch && results[localMatch.id]) {
              results[dbMatch.id] = results[localMatch.id];
            }
          }
          setMatches(createdMatches);
        }
      }
      // Teraz zapisz wyniki dla wszystkich meczów
      for (const match of (tournamentId ? matches : await getMatchesForTournament(finalTournamentId))) {
        const res = results[match.id];
        if (res && res.team1 !== '' && res.team2 !== '') {
          const team1Wins = parseInt(res.team1);
          const team2Wins = parseInt(res.team2);
          await updateMatchResult(match.id, team1Wins, team2Wins);
        }
      }
      setLoading(false);
      Alert.alert(
        '✅ Zapisano',
        'Turniej został zapisany w bazie danych',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (e) {
      setLoading(false);
      console.error('❌ Błąd przy zapisywaniu wyników:', e);
      Alert.alert('Błąd', 'Nie udało się zapisać wyników');
    }
  }
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Harmonogram Gier</Text>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007a32" />
          <Text style={styles.loadingText}>Trwa ładowanie...</Text>
        </View>
      ) : (
        <>
          {matches.map((match) => {
            // Debel: wyświetl drużyny po nazwie, nie graczy
            if (match.teams && match.teams[0] && match.teams[1]) {
              // Jeśli drużyny mają pole 'name', użyj go, w przeciwnym razie zbuduj nazwę z id
              const teamAName = match.teams[0].name || (match.teams[0].players ? match.teams[0].players.join(' / ') : 'Drużyna 1');
              const teamBName = match.teams[1].name || (match.teams[1].players ? match.teams[1].players.join(' / ') : 'Drużyna 2');
              return (
                <View key={match.id} style={styles.matchCard}>
                  <Text style={styles.matchLabel}>
                    Mecz {match.match_order}: {teamAName} vs {teamBName}
                  </Text>
                  <View style={styles.scoreRow}>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={results[match.id]?.team1}
                      onChangeText={(text) => handleChange(match.id, 'team1', text)}
                    />
                    <Text style={styles.vs}>:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      value={results[match.id]?.team2}
                      onChangeText={(text) => handleChange(match.id, 'team2', text)}
                    />
                  </View>
                </View>
              );
            }
            // Singiel: domyślna obsługa
            return (
              <View key={match.id} style={styles.matchCard}>
                <Text style={styles.matchLabel}>
                  Mecz {match.match_order}: {match.playersInfo?.[0]?.first_name || 'Gracz 1'} {match.playersInfo?.[0]?.last_name || ''} ({match.playersInfo?.[0]?.nick_name || 'N/A'}) vs {match.playersInfo?.[1]?.first_name || 'Gracz 2'} {match.playersInfo?.[1]?.last_name || ''} ({match.playersInfo?.[1]?.nick_name || 'N/A'})
                </Text>
                <View style={styles.scoreRow}>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={results[match.id]?.team1}
                    onChangeText={(text) => handleChange(match.id, 'team1', text)}
                  />
                  <Text style={styles.vs}>:</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={results[match.id]?.team2}
                    onChangeText={(text) => handleChange(match.id, 'team2', text)}
                  />
                </View>
              </View>
            );
          })}

          <View style={styles.saveButton}>
            <Button 
              title={tournamentId ? "Zakończ turniej" : "Zapisz turniej"} 
              onPress={saveResults} 
              color="#007a32" 
              disabled={loading}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    minHeight: '100%',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  matchCard: {
    marginBottom: 16,
    padding: 14,
    backgroundColor: '#f2f2f2',
    borderRadius: 10,
  },
  matchLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    width: 50,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 16,
  },
  vs: {
    marginHorizontal: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007a32',
  },
});
