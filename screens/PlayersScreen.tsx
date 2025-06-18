import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Keyboard, StatusBar, ScrollView, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { addPlayer, getPlayers, deletePlayer } from '../db';
import * as ImagePicker from 'expo-image-picker';
import { IMGUR_CLIENT_ID } from '../imgurConfig';

export default function PlayersScreen() {
  const [players, setPlayers] = useState<any[]>([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nickName, setNickName] = useState('');
  const [profileImage, setProfileImage] = useState<string | undefined>(undefined);

  // Pobierz graczy z bazy przy starcie i po każdej zmianie
  const loadPlayers = async () => {
    const data = await getPlayers();
    setPlayers(data);
  };

  useEffect(() => {
    loadPlayers();
  }, []);


  // Funkcja uploadu do Imgur
  async function uploadImageToImgur(imageUri: string): Promise<string> {
    const apiUrl = 'https://api.imgur.com/3/image';
    const clientId = IMGUR_CLIENT_ID;

    // Zamień obrazek na base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const result = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Client-ID ${clientId}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, type: 'base64' }),
    });
    const data = await result.json();
    if (!data.success) throw new Error('Upload failed');
    return data.data.link;
  }

  // Dodaj gracza do bazy
  const handleAddPlayer = async () => {
    console.log('▶ Próba dodania gracza');

    if (!firstName || !lastName || !nickName) {
      Alert.alert('Uwaga', 'Wypełnij wszystkie pola!');
      return;
    }

    let imageUrl = '';
    if (profileImage) {
      try {
        imageUrl = await uploadImageToImgur(profileImage);
      } catch (e) {
        Alert.alert('Błąd', 'Nie udało się wysłać zdjęcia.');
        return;
      }
    }

    try {
      await addPlayer(firstName, lastName, nickName, imageUrl);
      console.log('✅ Dodano gracza');
    } catch (e) {
      console.error('❌ Błąd przy dodawaniu gracza:', e);
    }

    setFirstName('');
    setLastName('');
    setNickName('');
    setProfileImage(undefined);
    Keyboard.dismiss();
    await loadPlayers();
  };

  // Obsługa wyboru zdjęcia
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <FlatList
        data={players}
        keyExtractor={item => item.id}
        renderItem={({ item }) => {
          let imageSource;
          if (item.profile_image_uri && item.profile_image_uri !== 'default' && item.profile_image_uri !== '') {
            // Jeśli to lokalny plik, dodaj prefix file:// jeśli go brakuje
            if (
              item.profile_image_uri.startsWith('http') ||
              item.profile_image_uri.startsWith('content://') ||
              item.profile_image_uri.startsWith('file://')
            ) {
              imageSource = { uri: item.profile_image_uri };
            } else {
              imageSource = { uri: 'file://' + item.profile_image_uri };
            }
          } else {
            imageSource = require('../assets/blanc_picture.jpg');
          }
          return (
            <View style={styles.playerRow}>
              <Image source={imageSource} style={{ width: 48, height: 48, borderRadius: 24, marginRight: 12 }} />
              <View style={styles.playerInfoContainer}>
                <Text style={styles.playerName}>
                  {item.first_name} {item.last_name} ({item.nick_name})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeletePlayer(item.id)}
              >
                <Text style={styles.deleteButtonText}>Usuń</Text>
              </TouchableOpacity>
            </View>
          );
        }}
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
              <TouchableOpacity style={[styles.addButton, { backgroundColor: '#4682b4' }]} onPress={pickImage}>
                <Text style={styles.addButtonText}>{profileImage ? 'Zmień zdjęcie' : 'Dodaj zdjęcie profilowe'}</Text>
              </TouchableOpacity>
              {profileImage && (
                <Image source={{ uri: profileImage }} style={{ width: 64, height: 64, borderRadius: 32, alignSelf: 'center', marginBottom: 10 }} />
              )}
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
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, width: '100%', flexGrow: 1 },
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
  playerInfoContainer: { flex: 1 },
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
