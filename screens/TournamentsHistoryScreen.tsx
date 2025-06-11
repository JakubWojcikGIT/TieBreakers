import React, { useState, useEffect } from 'react';
import { SafeAreaView, Text, FlatList, TouchableOpacity, StyleSheet, View, StatusBar, Alert } from 'react-native';
import { getTournaments, deleteTournament } from '../db';

export default function TournamentsHistoryScreen({ navigation }) {
  const [tournaments, setTournaments] = useState<any[]>([]);

  const loadTournaments = async () => {
    const data = await getTournaments();
    setTournaments(data);
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const handleDeleteTournament = (tournamentId: number) => {
    Alert.alert(
      'Potwierdź usunięcie',
      'Czy na pewno chcesz usunąć ten turniej wraz ze wszystkimi meczami?',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            await deleteTournament(tournamentId);
            await loadTournaments();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>Historia turniejów</Text>
      <FlatList
        data={tournaments}
        keyExtractor={item => item.tournament_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.tournamentRow}>
            <TouchableOpacity
              style={{ flex: 1 }}
              onPress={() =>
                navigation.navigate('TournamentDetails', {
                  tournamentId: item.tournament_id,
                  tournamentPlace: item.tournament_place,
                })
              }
            >
              <Text style={styles.tournamentName}>{item.tournament_place}</Text>
              <Text style={styles.tournamentInfo}>
                {item.single ? 'Singiel' : 'Debel'} • {item.created_at}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteTournament(item.tournament_id)}
            >
              <Text style={styles.deleteButtonText}>Usuń</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyList}>Brak turniejów.</Text>}
        contentContainerStyle={styles.container}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 18, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: 'bold', marginVertical: 16, color: '#222', textAlign: 'center' },
  tournamentRow: {
    backgroundColor: '#f7fafc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  tournamentName: { fontSize: 18, fontWeight: '600', color: '#222' },
  tournamentInfo: { fontSize: 13, color: '#888', marginTop: 2 },
  deleteButton: {
    backgroundColor: '#ff5252',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 10,
  },
  deleteButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyList: { color: '#bbb', fontStyle: 'italic', marginTop: 20, textAlign: 'center' },
});
