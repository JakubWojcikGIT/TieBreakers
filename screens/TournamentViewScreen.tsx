// screens/TournamentViewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button, FlatList, Alert, ScrollView,
} from 'react-native';
import { getMatchesForTournament, updateMatchResult } from '../db';

export default function TournamentViewScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const [matches, setMatches] = useState<any[]>([]);
  const [results, setResults] = useState<{ [key: number]: { team1: string, team2: string } }>({});

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
  const data = await getMatchesForTournament(tournamentId);
  // Usuń duplikaty po match_id
  const uniqueMatches = Array.from(
    new Map(data.map((m: any) => [m.match_id, m])).values()
  );
  setMatches(uniqueMatches);
  const initialResults: any = {};
  uniqueMatches.forEach((m: any) => {
    initialResults[m.match_id] = {
      team1: m.team1_wins?.toString() ?? '',
      team2: m.team2_wins?.toString() ?? '',
    };
  });
  setResults(initialResults);
}


  function handleChange(matchId: number, team: 'team1' | 'team2', value: string) {
    setResults((prev) => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value,
      },
    }));
  }

  async function saveResults() {
  try {
    for (const match of matches) {
      const res = results[match.match_id];
      if (res.team1 !== '' && res.team2 !== '') {
        await updateMatchResult(
          match.match_id,
          parseInt(res.team1),
          parseInt(res.team2)
        );
      }
    }
    Alert.alert(
      '✅ Zapisano',
      'Wyniki turnieju zostały zapisane',
      [
        {
          text: 'OK',
          onPress: () => {
            navigation.navigate('Home') // wraca na ekran główny
          }
        }
      ]
    );
  } catch (e) {
    console.error('❌ Błąd zapisu wyników:', e);
    Alert.alert('Błąd', 'Nie udało się zapisać wyników');
  }
}


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Harmonogram Gier</Text>
      {matches.map((match) => (
        <View key={match.match_id} style={styles.matchCard}>
          <Text style={styles.matchLabel}>
            Mecz {match.match_order}: {match.player1_first} ({match.player1_nick}) vs {match.player2_first} ({match.player2_nick})
          </Text>
          <View style={styles.scoreRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Team 1"
              value={results[match.match_id]?.team1}
              onChangeText={(text) => handleChange(match.match_id, 'team1', text)}
            />
            <Text style={styles.vs}>:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Team 2"
              value={results[match.match_id]?.team2}
              onChangeText={(text) => handleChange(match.match_id, 'team2', text)}
            />
          </View>
        </View>
      ))}

      <View style={styles.saveButton}>
        <Button title="Zakończ turniej" onPress={saveResults} color="#007a32" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
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
});
