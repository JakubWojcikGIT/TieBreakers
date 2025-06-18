import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Modal, TextInput } from 'react-native';
import { getPlayers } from '../db';

export default function SingleMatchCreateScreen({ navigation }) {
  const [matchType, setMatchType] = useState<'singiel' | 'debel'>('singiel');
  const [sets, setSets] = useState(2);
  const [players, setPlayers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [playerModalVisible, setPlayerModalVisible] = useState(false);
  const [place, setPlace] = useState('');

  useEffect(() => {
    getPlayers().then(setPlayers);
  }, []);

  function togglePlayer(playerId) {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : matchType === 'singiel'
          ? (prev.length < 2 ? [...prev, playerId] : prev)
          : (prev.length < 4 ? [...prev, playerId] : prev)
    );
  }

  function handlePlayerSelect(playerId) {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : matchType === 'singiel'
          ? (prev.length < 2 ? [...prev, playerId] : prev)
          : (prev.length < 4 ? [...prev, playerId] : prev)
    );
  }

  function handleMatchTypeChange(type) {
    setMatchType(type);
    setSelectedPlayers([]);
  }

  function handleCreateMatch() {
    if (!place.trim()) {
      alert('Podaj miejscowość meczu!');
      return;
    }
    if (matchType === 'singiel') {
      if (selectedPlayers.length !== 2) {
        alert('Wybierz dokładnie 2 graczy do meczu singlowego!');
        return;
      }
      const playerNames = players.filter(p => selectedPlayers.includes(p.id)).map(p => `${p.first_name} ${p.last_name}`);
      navigation.navigate('SingleMatch', {
        playerNames,
        sets,
        matchType,
        place,
      });
    } else {
      if (selectedPlayers.length !== 4) {
        alert('Wybierz dokładnie 4 graczy do meczu deblowego!');
        return;
      }      navigation.navigate('TeamPairing', {
        tournamentData: {
          playerIds: selectedPlayers,
          roundsToWin: sets,
          gamesPerSet: 6,
          type: 'debel',
          place,
          isSingleMatch: true,
        },
        players: players.filter(p => selectedPlayers.includes(p.id))
      });
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Nowy pojedyńczy mecz</Text>
        <View style={styles.section}>
          <Text style={styles.label}>Typ meczu:</Text>
          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.typeButton, matchType === 'singiel' && styles.typeButtonActive]}
              onPress={() => handleMatchTypeChange('singiel')}
            >
              <Text style={styles.typeButtonText}>Singiel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeButton, matchType === 'debel' && styles.typeButtonActive]}
              onPress={() => handleMatchTypeChange('debel')}
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
                style={[styles.optionButton, sets === opt.value && styles.optionButtonActive]}
                onPress={() => setSets(opt.value)}
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
                        ((matchType === 'singiel' && selectedPlayers.length >= 2) ||
                         (matchType === 'debel' && selectedPlayers.length >= 4))
                      }
                    >
                      <Text style={{ color: selectedPlayers.includes(player.id) ? '#fff' : '#222' }}>
                        {player.first_name} {player.last_name} ({player.nick_name})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setPlayerModalVisible(false)}
                >
                  <Text style={{ color: '#4caf50', fontWeight: 'bold', fontSize: 16 }}>Zatwierdź</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          <Text style={{ color: '#888', marginTop: 6, fontSize: 13 }}>
            {matchType === 'singiel' ? 'Wybierz dokładnie 2 graczy' : 'Wybierz dokładnie 4 graczy (2 pary)'}
          </Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={handleCreateMatch}>
          <Text style={styles.createButtonText}>Utwórz mecz</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
  section: { marginBottom: 22 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  row: { flexDirection: 'row', gap: 12 },
  typeButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginRight: 10,
  },
  typeButtonActive: { backgroundColor: '#b6e3b6' },
  typeButtonText: { fontSize: 16, fontWeight: '500' },
  optionButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginRight: 10,
  },
  optionButtonActive: { backgroundColor: '#b6e3b6' },
  optionButtonText: { fontSize: 16 },
  dropdownButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    width: '85%',
    alignItems: 'center',
  },
  playerModalItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#f0f0f0',
  },
  playerModalItemSelected: {
    backgroundColor: '#4caf50',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: '#eaf8e6',
  },
  createButton: {
    backgroundColor: '#4caf50',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 30,
    alignItems: 'center',
  },
  createButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  selectedPlayerTag: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  selectedPlayerTagText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 6,
  },
});
