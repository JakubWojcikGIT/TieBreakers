import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard, StatusBar, ScrollView } from 'react-native';
import { addPlayer, getPlayers, deletePlayer } from '../db';

export default function PlayersScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickName, setNickName] = useState('');
  const [email, setEmail] = useState('');
  const [homePlace, setHomePlace] = useState('');

  // Pobierz graczy z bazy przy starcie i po każdej zmianie
  const loadPlayers = async () => {
    const data = await getPlayers();
    setPlayers(data);
  };

  useEffect(() => {
    loadPlayers();
  }, []);


  // Dodaj gracza do bazy
  const handleAddPlayer = async () => {
    console.log('▶ Próba dodania gracza');

    if (!firstName || !lastName || !nickName || !email || !homePlace) {
      Alert.alert('Uwaga', 'Wypełnij wszystkie pola!');
      return;
    }

    try {
      await addPlayer(firstName, lastName, nickName, email, homePlace);
      console.log('✅ Dodano gracza');
    } catch (e) {
      console.error('❌ Błąd przy dodawaniu gracza:', e);
    }

    setFirstName('');
    setLastName('');
    setNickName('');
    setEmail('');
    setHomePlace('');
    Keyboard.dismiss();
    await loadPlayers();
  };

  const handleDeletePlayer = (playerId: string) => {
    Alert.alert('Potwierdź', 'Czy na pewno chcesz usunąć tego gracza?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlayer(playerId);
            await loadPlayers();
            console.log(`🗑️ Usunięto gracza o ID ${playerId}`);
          } catch (e) {
            console.error('❌ Błąd usuwania gracza:', e);
          }
        },
      },
    ]);
  };


  return (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" />
    <FlatList
      data={players}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.playerRow}>
          <View>
            <Text style={styles.playerName}>
              {item.first_name} {item.last_name} ({item.nick_name})
            </Text>
            <Text style={styles.playerInfo}>
              {item.email} • {item.home_place}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeletePlayer(item.id)}
          >
            <Text style={styles.deleteButtonText}>Usuń</Text>
          </TouchableOpacity>
        </View>
      )}
      ListEmptyComponent={<Text style={styles.emptyList}>Brak graczy.</Text>}
      ListHeaderComponent={
        <>
          <Text style={styles.title}>Gracze</Text>
          {/* Formularz dodawania gracza */}
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Imię"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Nazwisko"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.input}
              placeholder="Nick"
              value={nickName}
              onChangeText={setNickName}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Miejsce zamieszkania"
              value={homePlace}
              onChangeText={setHomePlace}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
              <Text style={styles.addButtonText}>Dodaj gracza</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.listTitle}>Lista graczy</Text>
        </>
      }
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    />
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, alignItems: 'center', flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 16, color: '#222' },
  form: { width: '100%', marginBottom: 20 },
  input: {
    backgroundColor: '#f3f6fa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    fontSize: 16,
    borderColor: '#e0e0e0',
    borderWidth: 1,
  },
  addButton: {
    backgroundColor: '#3cb371',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8, color: '#333', alignSelf: 'flex-start' },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    width: '100%',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  playerName: { fontSize: 16, fontWeight: '600', color: '#222' },
  playerInfo: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteButton: {
    backgroundColor: '#ff5252',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyList: { color: '#bbb', fontStyle: 'italic', marginTop: 20 },
});
