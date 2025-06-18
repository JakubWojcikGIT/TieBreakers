// screens/TournamentCreateScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, Modal, SafeAreaView
} from 'react-native';
import { getPlayers } from '../db';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentCreateScreen({ navigation }) {
  const [tournamentType, setTournamentType] = useState('singiel');
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [place, setPlace] = useState('');
  const [boType, setBoType] = useState(1); // 1=Bo1, 2=Bo3, 3=Bo5
  const [error, setError] = useState('');

  useEffect(() => { getPlayers().then(setPlayers); }, []);

  function handleTournamentTypeChange(type) {
    setTournamentType(type);
    setSelectedPlayers([]);
  }

  function handlePlayerSelect(playerId) {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : (tournamentType === 'singiel'
            ? [...prev, playerId]
            : [...prev, playerId])
    );
  }

  function isValid() {
    if (!place.trim()) return false;
    if (tournamentType === 'singiel') return selectedPlayers.length >= 3;
    if (tournamentType === 'debel') return selectedPlayers.length >= 6 && selectedPlayers.length % 2 === 0;
    return false;
  }

  function getValidationMessage() {
    if (!place.trim()) return 'Podaj miejsce rozgrywek';
    if (tournamentType === 'singiel' && selectedPlayers.length < 3) return 'Wybierz co najmniej 3 graczy';
    if (tournamentType === 'debel' && selectedPlayers.length < 6) return 'Wybierz co najmniej 6 graczy';
    if (tournamentType === 'debel' && selectedPlayers.length % 2 !== 0) return 'Wybierz parzystą liczbę graczy do debla';
    return '';
  }

  function handleCreate() {
    if (!isValid()) {
      setError(getValidationMessage());
      return;
    }
    setError('');
    const baseTournamentData = {
      place,
      playerIds: selectedPlayers,
      roundsToWin: boType, // roundsToWin = 1,2,3
      type: tournamentType,
    };
    if (tournamentType === 'debel') {
      navigation.navigate('TeamPairing', { tournamentData: baseTournamentData });
    } else {
      navigation.navigate('TournamentView', { tournamentData: baseTournamentData });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nowy turniej</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Typ turnieju:</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.typeButton, tournamentType === 'singiel' && styles.typeButtonActive]}
              onPress={() => handleTournamentTypeChange('singiel')}
            >
              <Text style={styles.typeButtonText}>Singiel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, tournamentType === 'debel' && styles.typeButtonActive]}
              onPress={() => handleTournamentTypeChange('debel')}
            >
              <Text style={styles.typeButtonText}>Debel</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Sposób rozgrywania setów:</Text>
          <View style={styles.row}>
            {[{ label: 'Bo1', value: 1 }, { label: 'Bo3', value: 2 }, { label: 'Bo5', value: 3 }].map(opt => (
              <TouchableOpacity
                key={opt.label}
                style={[styles.optionButton, boType === opt.value && styles.optionButtonActive]}
                onPress={() => setBoType(opt.value)}
              >
                <Text style={styles.optionButtonText}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Miejscowość:</Text>
          <TextInput
            style={styles.input}
            placeholder="Wpisz miejscowość..."
            value={place}
            onChangeText={setPlace}
            autoCorrect={false}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Wybierz graczy:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setPlayerModalVisible(true)}
          >
            {selectedPlayers.length === 0 ? (
              <Text style={{ color: '#222', fontSize: 16 }}>Wybierz graczy...</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {players
                  .filter(p => selectedPlayers.includes(p.id))
                  .map(p => (
                    <View key={p.id} style={styles.selectedPlayerTag}>
                      <Text style={styles.selectedPlayerTagText}>
                        {p.first_name} {p.last_name}
                      </Text>
                    </View>
                  ))}
              </View>
            )}
          </TouchableOpacity>
          <Modal
            visible={playerModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setPlayerModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Wybierz graczy</Text>
                <ScrollView style={{ maxHeight: 300 }}>
                  {players.map(player => (
                    <TouchableOpacity
                      key={player.id}
                      style={[
                        styles.playerModalItem,
                        selectedPlayers.includes(player.id) && styles.playerModalItemSelected
                      ]}
                      onPress={() => handlePlayerSelect(player.id)}
                      disabled={
                        !selectedPlayers.includes(player.id) &&
                        ((tournamentType === 'singiel' && selectedPlayers.length >= players.length) ||
                         (tournamentType === 'debel' && selectedPlayers.length >= players.length))
                      }
                    >
                      <Text style={{ color: selectedPlayers.includes(player.id) ? '#fff' : '#222' }}>
                        {player.first_name} {player.last_name} {player.nick_name ? `(${player.nick_name})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setPlayerModalVisible(false)}
                >
                  <Text style={{ color: '#FFFFFF', fontWeight: 'bold', fontSize: 16}}>Zatwierdź</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={{ color: '#888', marginTop: 6, fontSize: 13 }}>
            {tournamentType === 'singiel' ? 'Wybierz co najmniej 3 graczy' : 'Wybierz co najmniej 6 graczy (parzysta liczba)'}
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity
          style={[styles.button, !isValid() && { opacity: 0.5 }]}
          onPress={handleCreate}
          disabled={!isValid()}
        >
          <Text style={styles.buttonText}>Utwórz turniej</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007a32',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  typeButtonActive: {
    backgroundColor: '#e6ffe6',
  },
  typeButtonText: {
    color: '#007a32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#007a32',
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: '#e6ffe6',
  },
  optionButtonText: {
    color: '#007a32',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdownButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#007a32',
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedPlayerTag: {
    backgroundColor: '#007a32',
    borderRadius: 15,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedPlayerTagText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    elevation: 5,
  },
  playerModalItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playerModalItemSelected: {
    backgroundColor: '#007a32',
  },
  modalCloseButton: {
    marginTop: 12,
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
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
  error: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 15,
  },
});
