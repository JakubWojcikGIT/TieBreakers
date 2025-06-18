import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, ScrollView, Modal, Pressable } from 'react-native';
import { getPlayers, getTournaments, getMatchesByTournamentId } from '../db';
import dayjs from 'dayjs';

export default function GlobalStatsScreen() {
  const [statsType, setStatsType] = useState<'individual' | 'pairs' | null>(null);
  const [filter, setFilter] = useState<'wszyscy' | 'singiel' | 'debel'>('wszyscy');
  // sort: { key: 'wygrane'|'mecze'|'procent'|'nazwa', direction: 1|-1|0 }
  const [sort, setSort] = useState<{ key: 'wygrane' | 'mecze' | 'procent' | 'nazwa'; direction: 1 | -1 | 0 }>({ key: 'mecze', direction: -1 });
  const [placeFilter, setPlaceFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<'all' | 'week' | 'month'>('all');
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [places, setPlaces] = useState<string[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [showFilter, setShowFilter] = useState<'none' | 'tryb' | 'miejsce' | 'okres'>('none');

  // Pobierz dane z bazy
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const playersData = await getPlayers();
      const tournamentsData = await getTournaments();
      setPlayers(playersData);
      setTournaments(tournamentsData);
      // Pobierz wszystkie mecze ze wszystkich turniejów
      let matches: any[] = [];
      let uniquePlaces = new Set<string>();
      for (const t of tournamentsData) {
        const place = (t as any).tournament_place;
        if (place) uniquePlaces.add(place);
        const ms = await getMatchesByTournamentId(t.id);
        matches = matches.concat(ms.map(m => ({ ...m, tournament: t })));
      }
      setAllMatches(matches);
      setPlaces(Array.from(uniquePlaces));
      setLoading(false);
    };
    fetchData();
  }, []);

  // Przetwarzanie statystyk
  useEffect(() => {
    if (loading) return;
    let filteredMatches = allMatches;
    if (filter !== 'wszyscy') {
      filteredMatches = filteredMatches.filter(m => m.tournament?.single === (filter === 'singiel'));
    }
    if (placeFilter) {
      filteredMatches = filteredMatches.filter(m => m.tournament?.tournament_place === placeFilter);
    }
    if (dateRange !== 'all') {
      const now = dayjs();
      filteredMatches = filteredMatches.filter(m => {
        const dateStr = m.tournament?.created_at;
        if (!dateStr) return false;
        const matchDate = dayjs(dateStr);
        if (dateRange === 'week') return matchDate.isAfter(now.subtract(7, 'day'));
        if (dateRange === 'month') return matchDate.isAfter(now.subtract(1, 'month'));
        return true;
      });
    }
    const statsMap: Record<string, any> = {};
    filteredMatches.forEach(m => {
      // Singiel
      if (m.playersInfo && m.playersInfo.length === 2) {
        m.playersInfo.forEach((p: any, idx: number) => {
          if (!statsMap[p.id]) statsMap[p.id] = { id: p.id, name: p.name, wins: 0, games: 0 };
          statsMap[p.id].games++;
          if (m.winner_team_number === idx + 1) statsMap[p.id].wins++;
        });
      }
      // Debel: rozbij drużynę na graczy i każdemu z nich dodaj mecz i win jeśli drużyna wygrała
      if (m.teamsInfo && Array.isArray(m.teamsInfo) && m.teamsInfo.length === 2 && m.teams) {
        m.teams.forEach((team: any, idx: number) => {
          if (Array.isArray(team.players)) {
            team.players.forEach((playerId: string) => {
              // Znajdź nazwę gracza (jeśli masz players w pamięci)
              let playerName = playerId;
              const playerObj = players.find((pl: any) => pl.id === playerId);
              if (playerObj) playerName = `${playerObj.first_name} ${playerObj.last_name}`;
              if (!statsMap[playerId]) statsMap[playerId] = { id: playerId, name: playerName, wins: 0, games: 0 };
              statsMap[playerId].games++;
              if (m.winner_team_number === idx + 1) statsMap[playerId].wins++;
            });
          }
        });
      }
    });
    let statsArr = Object.values(statsMap).map((row: any) => ({
      ...row,
      percent: row.games > 0 ? Math.round((row.wins / row.games) * 100) : 0
    }));
    // Sortowanie
    if (sort.direction !== 0) {
      statsArr = statsArr.sort((a: any, b: any) => {
        if (sort.key === 'wygrane') return sort.direction * (b.wins - a.wins);
        if (sort.key === 'mecze') return sort.direction * (b.games - a.games);
        if (sort.key === 'procent') return sort.direction * (b.percent - a.percent);
        if (sort.key === 'nazwa') return sort.direction * a.name.localeCompare(b.name, 'pl');
        return 0;
      });
    }
    setStats(statsArr);
  }, [allMatches, filter, sort, placeFilter, dateRange, loading]);

  // Obsługa kliknięcia w nagłówek sortowania
  function handleSort(key: 'wygrane' | 'mecze' | 'procent' | 'nazwa') {
    setSort(prev => {
      if (prev.key !== key) return { key, direction: -1 };
      if (prev.direction === -1) return { key, direction: 1 };
      if (prev.direction === 1) return { key, direction: 0 };
      return { key, direction: -1 };
    });
  }

  // Panel wyboru typu statystyk
  if (statsType === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.title}>Wybierz rodzaj statystyk</Text>
        <View style={{ marginTop: 40, alignItems: 'center' }}>
          <TouchableOpacity style={[styles.filterTab, { minWidth: 180, marginBottom: 16 }]} onPress={() => setStatsType('individual')}>
            <Text style={styles.filterTabText}>Statystyki indywidualne</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.filterTab, { minWidth: 180 }]} onPress={() => setStatsType('pairs')}>
            <Text style={styles.filterTabText}>Statystyki par deblowych</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Statystyki INDYWIDUALNE (obecny panel)
  if (statsType === 'individual') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => setStatsType(null)} style={{ alignSelf: 'flex-start', margin: 12 }}>
          <Text style={{ color: '#4682b4', fontWeight: 'bold' }}>{'< Powrót'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statystyki indywidualne</Text>
        {loading ? <ActivityIndicator size="large" color="#4682b4" style={{ marginTop: 40 }} /> : (
          <FlatList
            data={stats}
            keyExtractor={item => item.id}
            ListHeaderComponent={
              <>
                {/* Filtry jako zakładki w dwóch rzędach */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
                  <TouchableOpacity style={[styles.filterTab, showFilter === 'tryb' && styles.filterTabActive]} onPress={() => setShowFilter(showFilter === 'tryb' ? 'none' : 'tryb')}>
                    <Text style={styles.filterTabText}>Tryb: <Text style={{ fontWeight: 'bold' }}>{filter === 'wszyscy' ? 'Wszyscy' : filter.charAt(0).toUpperCase() + filter.slice(1)}</Text></Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.filterTab, showFilter === 'miejsce' && styles.filterTabActive]} onPress={() => setShowFilter(showFilter === 'miejsce' ? 'none' : 'miejsce')}>
                    <Text style={styles.filterTabText}>Miejscowość: <Text style={{ fontWeight: 'bold' }}>{placeFilter || 'Wszystkie'}</Text></Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.filterTab, showFilter === 'okres' && styles.filterTabActive]} onPress={() => setShowFilter(showFilter === 'okres' ? 'none' : 'okres')}>
                    <Text style={styles.filterTabText}>Okres: <Text style={{ fontWeight: 'bold' }}>{dateRange === 'all' ? 'Cały okres' : dateRange === 'week' ? 'Ostatni tydzień' : 'Ostatni miesiąc'}</Text></Text>
                  </TouchableOpacity>
                </View>
                {/* Modal wyboru trybu */}
                <Modal visible={showFilter === 'tryb'} transparent animationType="fade">
                  <Pressable style={styles.modalOverlay} onPress={() => setShowFilter('none')}>
                    <View style={styles.modalBox}>
                      <Text style={styles.modalTitle}>Wybierz tryb</Text>
                      {['wszyscy', 'singiel', 'debel'].map(opt => (
                        <TouchableOpacity key={opt} style={filter === opt ? styles.filterActive : styles.filterBtn} onPress={() => { setFilter(opt as any); setShowFilter('none'); }}>
                          <Text>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Pressable>
                </Modal>
                {/* Modal wyboru miejscowości */}
                <Modal visible={showFilter === 'miejsce'} transparent animationType="fade">
                  <Pressable style={styles.modalOverlay} onPress={() => setShowFilter('none')}>
                    <View style={styles.modalBox}>
                      <Text style={styles.modalTitle}>Wybierz miejscowość</Text>
                      <TouchableOpacity style={!placeFilter ? styles.filterActive : styles.filterBtn} onPress={() => { setPlaceFilter(''); setShowFilter('none'); }}>
                        <Text>Wszystkie</Text>
                      </TouchableOpacity>
                      {places.map(place => (
                        <TouchableOpacity key={place} style={placeFilter === place ? styles.filterActive : styles.filterBtn} onPress={() => { setPlaceFilter(place); setShowFilter('none'); }}>
                          <Text numberOfLines={1} style={{ maxWidth: 120 }}>{place}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </Pressable>
                </Modal>
                {/* Modal wyboru okresu */}
                <Modal visible={showFilter === 'okres'} transparent animationType="fade">
                  <Pressable style={styles.modalOverlay} onPress={() => setShowFilter('none')}>
                    <View style={styles.modalBox}>
                      <Text style={styles.modalTitle}>Wybierz okres</Text>
                      <TouchableOpacity style={dateRange === 'all' ? styles.filterActive : styles.filterBtn} onPress={() => { setDateRange('all'); setShowFilter('none'); }}>
                        <Text>Cały okres</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={dateRange === 'week' ? styles.filterActive : styles.filterBtn} onPress={() => { setDateRange('week'); setShowFilter('none'); }}>
                        <Text>Ostatni tydzień</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={dateRange === 'month' ? styles.filterActive : styles.filterBtn} onPress={() => { setDateRange('month'); setShowFilter('none'); }}>
                        <Text>Ostatni miesiąc</Text>
                      </TouchableOpacity>
                    </View>
                  </Pressable>
                </Modal>
                {/* Nagłówki tabeli w tej samej siatce co dane */}
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>#</Text>
                  <TouchableOpacity style={{ flex: 3 }} onPress={() => handleSort('nazwa')}>
                    <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'left' }]}>Gracz {sort.key === 'nazwa' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('mecze')}>
                    <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Mecze {sort.key === 'mecze' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('wygrane')}>
                    <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Wygrane {sort.key === 'wygrane' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('procent')}>
                    <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Win % {sort.key === 'procent' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
                  </TouchableOpacity>
                </View>
              </>
            }
            renderItem={({ item, index }) => (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1.2 }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { flex: 3, textAlign: 'left' }]} numberOfLines={1}>{item.name}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.games}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.wins}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.percent}%</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Brak danych do wyświetlenia.</Text>}
          />
        )}
      </SafeAreaView>
    );
  }

  // Statystyki PAR DEBLOWYCH
  if (statsType === 'pairs') {
    // Przetwarzanie statystyk par deblowych
    let filteredMatches = allMatches.filter(m => m.teamsInfo && Array.isArray(m.teamsInfo) && m.teamsInfo.length === 2 && m.teams);
    if (placeFilter) {
      filteredMatches = filteredMatches.filter(m => m.tournament?.tournament_place === placeFilter);
    }
    if (dateRange !== 'all') {
      const now = dayjs();
      filteredMatches = filteredMatches.filter(m => {
        const dateStr = m.tournament?.created_at;
        if (!dateStr) return false;
        const matchDate = dayjs(dateStr);
        if (dateRange === 'week') return matchDate.isAfter(now.subtract(7, 'day'));
        if (dateRange === 'month') return matchDate.isAfter(now.subtract(1, 'month'));
        return true;
      });
    }
    // Klucz pary: posortowane id graczy połączone _
    const pairsMap: Record<string, { ids: string[]; names: string; wins: number; games: number } > = {};
    filteredMatches.forEach(m => {
      m.teams.forEach((team: any, idx: number) => {
        if (Array.isArray(team.players)) {
          const sortedIds = [...team.players].sort();
          const key = sortedIds.join('_');
          // Nazwa pary
          let names = sortedIds.map(pid => {
            const p = players.find((pl: any) => pl.id === pid);
            return p ? `${p.first_name} ${p.last_name}` : pid;
          }).join(' / ');
          if (!pairsMap[key]) pairsMap[key] = { ids: sortedIds, names, wins: 0, games: 0 };
          pairsMap[key].games++;
          if (m.winner_team_number === idx + 1) pairsMap[key].wins++;
        }
      });
    });
    let pairsArr = Object.values(pairsMap).map(row => ({
      ...row,
      percent: row.games > 0 ? Math.round((row.wins / row.games) * 100) : 0
    }));
    // Sortowanie par
    if (sort.direction !== 0) {
      pairsArr = pairsArr.sort((a, b) => {
        if (sort.key === 'wygrane') return sort.direction * (b.wins - a.wins);
        if (sort.key === 'mecze') return sort.direction * (b.games - a.games);
        if (sort.key === 'procent') return sort.direction * (b.percent - a.percent);
        if (sort.key === 'nazwa') return sort.direction * a.names.localeCompare(b.names, 'pl');
        return 0;
      });
    }
    return (
      <SafeAreaView style={styles.safeArea}>
        <TouchableOpacity onPress={() => setStatsType(null)} style={{ alignSelf: 'flex-start', margin: 12 }}>
          <Text style={{ color: '#4682b4', fontWeight: 'bold' }}>{'< Powrót'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Statystyki par deblowych</Text>
        {/* Filtry i modale jak w indywidualnych */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 4 }}>
          <TouchableOpacity style={[styles.filterTab, showFilter === 'miejsce' && styles.filterTabActive]} onPress={() => setShowFilter(showFilter === 'miejsce' ? 'none' : 'miejsce')}>
            <Text style={styles.filterTabText}>Miejscowość: <Text style={{ fontWeight: 'bold' }}>{placeFilter || 'Wszystkie'}</Text></Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
          <TouchableOpacity style={[styles.filterTab, showFilter === 'okres' && styles.filterTabActive]} onPress={() => setShowFilter(showFilter === 'okres' ? 'none' : 'okres')}>
            <Text style={styles.filterTabText}>Okres: <Text style={{ fontWeight: 'bold' }}>{dateRange === 'all' ? 'Cały okres' : dateRange === 'week' ? 'Ostatni tydzień' : 'Ostatni miesiąc'}</Text></Text>
          </TouchableOpacity>
        </View>
        {/* Modale wyboru miejsca/okresu (jak wyżej) */}
        {/* Nagłówki tabeli i FlatList dla par */}
        <View style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>#</Text>
          <TouchableOpacity style={{ flex: 3 }} onPress={() => handleSort('nazwa')}>
            <Text style={[styles.tableCell, { fontWeight: 'bold', textAlign: 'left' }]}>Para {sort.key === 'nazwa' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('mecze')}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Mecze {sort.key === 'mecze' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('wygrane')}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Wygrane {sort.key === 'wygrane' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1.5 }} onPress={() => handleSort('procent')}>
            <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Win % {sort.key === 'procent' ? (sort.direction === -1 ? '↓' : sort.direction === 1 ? '↑' : '') : ''}</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={pairsArr}
          keyExtractor={item => item.ids.join('_')}
          renderItem={({ item, index }) => (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.2 }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { flex: 3, textAlign: 'left' }]} numberOfLines={1}>{item.names}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.games}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.wins}</Text>
              <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.percent}%</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Brak danych do wyświetlenia.</Text>}
        />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#222', textAlign: 'center' },
  filtersContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, justifyContent: 'center' },
  sectionLabel: { fontWeight: 'bold', marginRight: 8, color: '#333' },
  filterBtn: { backgroundColor: '#e0e0e0', borderRadius: 6, padding: 6, marginHorizontal: 4 },
  filterActive: { backgroundColor: '#4682b4', borderRadius: 6, padding: 6, marginHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderColor: '#e0e0e0', paddingVertical: 3 },
  tableCell: { fontSize: 14, color: '#333', textAlign: 'center' },
  chartsPlaceholder: { marginTop: 30, alignItems: 'center' },
  filterTab: { backgroundColor: '#e0e0e0', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, marginHorizontal: 4, marginVertical: 4 },
  filterTabActive: { backgroundColor: '#4682b4' },
  filterTabText: { color: '#222', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 24, minWidth: 220, elevation: 4 },
  modalTitle: { fontWeight: 'bold', fontSize: 18, marginBottom: 12, color: '#222', textAlign: 'center' },
});
