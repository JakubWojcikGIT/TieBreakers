// screens/TournamentCreateScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert,
} from 'react-native';
import { getPlayers } from '../db';
import { addTournamentWithMatches } from '../db';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentCreateScreen({ navigation }: any) {
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [roundsToWin, setRoundsToWin] = useState('2');
  const [place, setPlace] = useState('');
  const [tournamentType, setTournamentType] = useState('singiel');

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const data = await getPlayers();
    setPlayers(data);
  }

  function toggleSelectPlayer(playerId: string) {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  }

  function handleTournamentTypeChange(type: string) {
    setTournamentType(type);
  }

  async function startTournament() {
    if (!place || selectedPlayers.length < (tournamentType === 'debel' ? 4 : 2)) {
      Alert.alert('Błąd', `Podaj nazwę miejsca i wybierz min. ${tournamentType === 'debel' ? 4 : 2} graczy`);
      return;
    }

    if (tournamentType === 'debel' && selectedPlayers.length % 2 !== 0) {
      Alert.alert('Błąd', 'Liczba graczy musi być parzysta dla trybu debel');
      return;
    }

    const parsedRounds = parseInt(roundsToWin);
    if (isNaN(parsedRounds) || parsedRounds < 1) {
      Alert.alert('Błąd', 'Podaj poprawną liczbę wygranych rund');
      return;
    }

    try {
      const baseTournamentData = {
        place,
        playerIds: selectedPlayers,
        roundsToWin: parsedRounds,
        type: tournamentType,
      };
      if (tournamentType === 'debel') {
        navigation.navigate('TeamPairing', { tournamentData: baseTournamentData });
      } else {
        navigation.navigate('TournamentView', { tournamentData: baseTournamentData });
      }
    } catch (e) {
      console.error('❌ Błąd przy tworzeniu turnieju:', e);
      Alert.alert('Błąd', 'Nie udało się utworzyć turnieju');
    }
  }

  return (
    <FlatList
      style={styles.container}
      data={[{ key: 'header' }, ...players]}
      keyExtractor={(item, index) => (item.key ? item.key : item.id)}
      renderItem={({ item }) => {
        if (item.key === 'header') {
          return (
            <View>
              <Text style={styles.label}>Miejsce rozgrywek</Text>
              <TextInput
                placeholder="Kijewo Królewskie"
                value={place}
                onChangeText={setPlace}
                style={styles.input}
              />

              <Text style={styles.label}>Do ilu wygranych gemów</Text>
              <TextInput
                keyboardType="numeric"
                value={roundsToWin}
                onChangeText={setRoundsToWin}
                style={styles.input}
              />

              <Text style={styles.label}>Wybierz graczy ({selectedPlayers.length})</Text>

              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, tournamentType === 'singiel' && styles.selectedTypeButton]}
                  onPress={() => handleTournamentTypeChange('singiel')}
                >
                  <Text style={styles.typeButtonText}>Singiel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.typeButton, tournamentType === 'debel' && styles.selectedTypeButton]}
                  onPress={() => handleTournamentTypeChange('debel')}
                >
                  <Text style={styles.typeButtonText}>Debel</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        const selected = selectedPlayers.includes(item.id);
        return (
          <TouchableOpacity
            onPress={() => toggleSelectPlayer(item.id)}
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
      ListFooterComponent={() => (
        <TouchableOpacity style={styles.button} onPress={startTournament}>
          <Text style={styles.buttonText}>Utwórz turniej</Text>
        </TouchableOpacity>
      )}
    />
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
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007a32',
    borderRadius: 10,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#e6ffe6',
  },
  typeButtonText: {
    color: '#007a32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  form: {
    marginTop: 20,
  },
});
