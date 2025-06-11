// screens/TournamentViewScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, Button, FlatList, Alert, ScrollView,
} from 'react-native';
import { getMatchesForTournament, updateMatchResult } from '../db';

export default function TournamentViewScreen({ route, navigation }: any) {
  const { tournamentId } = route.params;
  const [matches, setMatches] = useState<any[]>([]);
  const [results, setResults] = useState<{ [key: string]: { team1: string, team2: string } }>({});

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
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

  async function saveResults() {
  try {
    for (const match of matches) {
      const res = results[match.id];
      if (res.team1 !== '' && res.team2 !== '') {
        await updateMatchResult(
          match.id,
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
      <Text style={styles.header}>Harmonogram Gier</Text>      {matches.map((match) => (
        <View key={match.id} style={styles.matchCard}>
          <Text style={styles.matchLabel}>
            Mecz {match.match_order}: {match.playersInfo?.[0]?.name || 'Gracz 1'} ({match.playersInfo?.[0]?.nick || 'N/A'}) vs {match.playersInfo?.[1]?.name || 'Gracz 2'} ({match.playersInfo?.[1]?.nick || 'N/A'})
          </Text>
          <View style={styles.scoreRow}>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Team 1"
              value={results[match.id]?.team1}
              onChangeText={(text) => handleChange(match.id, 'team1', text)}
            />
            <Text style={styles.vs}>:</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="Team 2"
              value={results[match.id]?.team2}
              onChangeText={(text) => handleChange(match.id, 'team2', text)}
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
