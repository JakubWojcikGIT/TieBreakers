import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { getPlayers } from '../db';

export default function TeamPairingScreen({ route, navigation }: any) {
  const { tournamentData } = route.params;
  const selectedPlayers = tournamentData.playerIds;
  const [playersInfo, setPlayersInfo] = useState<any[]>([]);
  const [teams, setTeams] = useState<{ id: string; players: any[] }[]>([]);
  const [unassigned, setUnassigned] = useState<any[]>([]);

  useEffect(() => {
    async function loadPlayersInfo() {
      const all = await getPlayers();
      const info = all.filter((p) => selectedPlayers.includes(p.id));
      setPlayersInfo(info);
      setUnassigned(info);
      // Tworzymy puste drużyny
      const numTeams = info.length / 2;
      setTeams(
        Array.from({ length: numTeams }, (_, i) => ({
          id: `team_${i + 1}`,
          players: [null, null],
        }))
      );
    }
    loadPlayersInfo();
  }, []);

  function assignPlayerToTeam(player: any, teamIdx: number, slotIdx: number) {
    if (teams[teamIdx].players[slotIdx]) return;
    // Usuwamy gracza z nieprzypisanych
    setUnassigned((prev) => prev.filter((p) => p.id !== player.id));
    // Przypisujemy gracza do slotu
    setTeams((prev) => {
      const copy = prev.map((t) => ({ ...t, players: [...t.players] }));
      copy[teamIdx].players[slotIdx] = player;
      return copy;
    });
  }

  function removePlayerFromTeam(teamIdx: number, slotIdx: number) {
    const player = teams[teamIdx].players[slotIdx];
    if (!player) return;
    setUnassigned((prev) => [...prev, player]);
    setTeams((prev) => {
      const copy = prev.map((t) => ({ ...t, players: [...t.players] }));
      copy[teamIdx].players[slotIdx] = null;
      return copy;
    });
  }

  function allTeamsReady() {
    return teams.every((t) => t.players[0] && t.players[1]);
  }
  function finishPairing() {
    if (!allTeamsReady()) {
      Alert.alert('Błąd', 'Każda drużyna musi mieć dwóch graczy!');
      return;
    }
    
    // Check if this is for a single match
    if (tournamentData.isSingleMatch) {
      // For a single match between two teams
      const teamNames = teams.map(t => 
        `${t.players[0].first_name} ${t.players[0].last_name} / ${t.players[1].first_name} ${t.players[1].last_name}`
      );
      
      // Navigate directly to SingleMatch with team names
      navigation.navigate('SingleMatch', {
        playerNames: teamNames,
        sets: tournamentData.roundsToWin,
        matchType: 'debel',
        place: tournamentData.place,
      });
      return;
    }
    
    // For tournament mode, generate matches between all teams
    const matches = [];
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        matches.push({
          teamA: teams[i],
          teamB: teams[j],
          teamAName: `${teams[i].players[0].first_name} ${teams[i].players[0].last_name} / ${teams[i].players[1].first_name} ${teams[i].players[1].last_name}`,
          teamBName: `${teams[j].players[0].first_name} ${teams[j].players[0].last_name} / ${teams[j].players[1].first_name} ${teams[j].players[1].last_name}`,
        });
      }
    }
    
    navigation.navigate('TournamentView', {
      tournamentData: {
        ...tournamentData,
        teams: teams.map((t) => ({
          id: t.id,
          players: t.players.map((p) => p.id),
          name: `${t.players[0].first_name} ${t.players[0].last_name} / ${t.players[1].first_name} ${t.players[1].last_name}`,
        })),
        matches,
      },
    });
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Przypisz graczy do drużyn (po 2 osoby)</Text>
      <View style={styles.teamsContainer}>
        {teams.map((team, teamIdx) => (
          <View key={team.id} style={styles.teamBox}>
            <Text style={styles.teamLabel}>Drużyna {teamIdx + 1}</Text>
            <View style={styles.teamSlots}>
              {[0, 1].map((slotIdx) => (
                <TouchableOpacity
                  key={slotIdx}
                  style={styles.playerSlot}
                  onPress={() => removePlayerFromTeam(teamIdx, slotIdx)}
                  disabled={!team.players[slotIdx]}
                >
                  <Text style={styles.playerSlotText}>
                    {team.players[slotIdx]
                      ? `${team.players[slotIdx].first_name} ${team.players[slotIdx].last_name}`
                      : '---'}
                  </Text>
                  {team.players[slotIdx] && (
                    <Text style={styles.removeText}>Usuń</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.header}>Nieprzypisani gracze</Text>
      <View style={styles.unassignedContainer}>
        {unassigned.length === 0 && <Text>Wszyscy gracze są w drużynach.</Text>}
        {unassigned.map((player) => (
          <View key={player.id} style={styles.unassignedPlayerRow}>
            <Text style={styles.unassignedPlayerText}>
              {player.first_name} {player.last_name}
            </Text>
            {teams.map(
              (team, teamIdx) =>
                team.players.includes(null) && (
                  <TouchableOpacity
                    key={team.id}
                    style={styles.assignButton}
                    onPress={() => {
                      const slotIdx = team.players[0] ? 1 : 0;
                      assignPlayerToTeam(player, teamIdx, slotIdx);
                    }}
                  >
                    <Text>Do drużyny {teamIdx + 1}</Text>
                  </TouchableOpacity>
                )
            )}
          </View>
        ))}
      </View>
      <TouchableOpacity
        style={[
          styles.finishButton,
          !allTeamsReady() && { backgroundColor: '#ccc' },
        ]}
        onPress={finishPairing}
        disabled={!allTeamsReady()}
      >
        <Text style={styles.finishButtonText}>
          Zatwierdź drużyny i przejdź dalej
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 12,
    textAlign: 'center',
  },
  teamsContainer: { marginBottom: 24 },
  teamBox: {
    borderWidth: 1,
    borderColor: '#007a32',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#e6ffe6',
  },
  teamLabel: { fontWeight: 'bold', marginBottom: 8 },
  teamSlots: { flexDirection: 'row', justifyContent: 'space-between' },
  playerSlot: {
    flex: 1,
    marginHorizontal: 4,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  playerSlotText: { fontSize: 15 },
  removeText: { color: 'red', fontSize: 12 },
  unassignedContainer: { marginBottom: 24 },
  unassignedPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  unassignedPlayerText: { flex: 1, fontSize: 15 },
  assignButton: {
    backgroundColor: '#007a32',
    padding: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  finishButton: {
    backgroundColor: '#007a32',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  finishButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
