// screens/TournamentCreateScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert, ScrollView,
} from 'react-native';
import { getPlayers } from '../db';
import { Ionicons } from '@expo/vector-icons';
import { addTournamentWithMatches } from '../logic/tournamentUtils';

export default function TournamentCreateScreen({ navigation }: any) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [roundsToWin, setRoundsToWin] = useState('2');
  const [place, setPlace] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const data = await getPlayers();
    setPlayers(data);
  }

  function toggleSelectPlayer(playerId: number) {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  async function startTournament() {
  if (!place || selectedPlayers.length < 2) {
    Alert.alert('Błąd', 'Podaj nazwę miejsca i wybierz min. 2 graczy');
    return;
  }

  const parsedRounds = parseInt(roundsToWin);
  if (isNaN(parsedRounds) || parsedRounds < 1) {
    Alert.alert('Błąd', 'Podaj poprawną liczbę wygranych rund (np. 2 dla Bo3)');
    return;
  }

  try {
    const tournamentId = await addTournamentWithMatches(place, selectedPlayers, parsedRounds);
    // Przejdź do ekranu szczegółów turnieju
    navigation.navigate('TournamentView', { tournamentId });
  } catch (e) {
    console.error('❌ Błąd przy tworzeniu turnieju:', e);
    Alert.alert('Błąd', 'Nie udało się utworzyć turnieju');
  }
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>Miejsce rozgrywek</Text>
      <TextInput
        placeholder="Korty Warszawa"
        value={place}
        onChangeText={setPlace}
        style={styles.input}
      />

      <Text style={styles.label}>Do ilu wygranych gemów (np. 2 = Bo3)</Text>
      <TextInput
        keyboardType="numeric"
        value={roundsToWin}
        onChangeText={setRoundsToWin}
        style={styles.input}
      />

      <Text style={styles.label}>Wybierz graczy ({selectedPlayers.length})</Text>
      <FlatList
        data={players}
        keyExtractor={(item) => item.player_id.toString()}
        renderItem={({ item }) => {
          const selected = selectedPlayers.includes(item.player_id);
          return (
            <TouchableOpacity
              onPress={() => toggleSelectPlayer(item.player_id)}
              style={[
                styles.playerItem,
                selected && styles.playerItemSelected
              ]}
            >
              <Text style={styles.playerText}>
                {item.first_name} {item.last_name} ({item.nick_name})
              </Text>
              {selected && <Ionicons name="checkmark" size={20} color="#007a32" />}
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.button} onPress={startTournament}>
        <Text style={styles.buttonText}>Utwórz turniej</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  playerItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  playerItemSelected: {
    backgroundColor: '#e6ffe6',
  },
  playerText: {
    fontSize: 16,
  },
  button: {
    marginTop: 24,
    backgroundColor: '#007a32',
    padding: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
