import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Alert } from 'react-native';

type Score = {
  points: [number | string, number | string];
  games: [number, number];
  sets: [number, number];
  currentSet: number;
  setScores: Array<[number, number]>;
};

type Stats = {
  aces: [number, number];
  doubleFaults: [number, number];
  singleFaults: [number, number];
  points: [number, number];
};

type PointValue = 0 | 15 | 30 | 40 | 'Ad';

const pointsDisplay = (point: number | string): string => point === 'Ad' ? 'Ad' : String(point);

export default function SingleMatchScreen({ route, navigation }) {
  const { playerNames, sets: setsToWin, matchType, place } = route.params;

  const [score, setScore] = useState<Score>({
    points: [0, 0],
    games: [0, 0],
    sets: [0, 0],
    currentSet: 0,
    setScores: [],
  });

  const [stats, setStats] = useState<Stats>({
    aces: [0, 0],
    doubleFaults: [0, 0],
    singleFaults: [0, 0],
    points: [0, 0],
  });

  const [matchFinished, setMatchFinished] = useState(false);
  const [matchCanBeFinished, setMatchCanBeFinished] = useState(false);
  const [tiebreak, setTiebreak] = useState(false);
  const [history, setHistory] = useState<Array<{
    action: string;
    playerIndex: number;
    prevScore?: Score;
    prevStats?: Stats;
  }>>([]);

  const convertPoints = (points: number): PointValue => {
    switch (points) {
      case 0: return 0;
      case 1: return 15;
      case 2: return 30;
      case 3: return 40;
      case 4: return 'Ad';
      default: return 0;
    }
  };

  // --- BLOKADA: nie pozwól dodawać punktów/błędów gdy matchCanBeFinished ---
  const canEdit = !matchFinished && !matchCanBeFinished;

  const addPoint = (playerIndex: number) => {
    if (matchFinished || matchCanBeFinished) return;
    const historyItem = {
      action: 'point',
      playerIndex,
      prevScore: JSON.parse(JSON.stringify(score)),
      prevStats: JSON.parse(JSON.stringify(stats)),
    };
    const newStats = { ...stats };
    newStats.points[playerIndex] += 1;
    setStats(newStats);
    if (tiebreak) {
      handleTiebreakPoint(playerIndex);
    } else {
      handleRegularPoint(playerIndex);
    }
    setHistory([...history, historyItem]);
  };

  const handleRegularPoint = (playerIndex: number) => {
    const newScore = { ...score };
    const otherPlayer = playerIndex === 0 ? 1 : 0;
    if (newScore.points[0] === 40 && newScore.points[1] === 40) {
      newScore.points[playerIndex] = 'Ad';
    } else if (newScore.points[playerIndex] === 'Ad') {
      newScore.points = [0, 0];
      newScore.games[playerIndex] += 1;
      checkSetCompletion(newScore);
    } else if (newScore.points[otherPlayer] === 'Ad') {
      newScore.points = [40, 40];
    } else {
      const numericPoints = newScore.points[playerIndex] === 0 ? 0 :
        newScore.points[playerIndex] === 15 ? 1 :
        newScore.points[playerIndex] === 30 ? 2 :
        newScore.points[playerIndex] === 40 ? 3 : 0;
      newScore.points[playerIndex] = convertPoints(numericPoints + 1);
      if (newScore.points[playerIndex] === 'Ad' && newScore.points[otherPlayer] !== 40) {
        newScore.points = [0, 0];
        newScore.games[playerIndex] += 1;
        checkSetCompletion(newScore);
      }
    }
    setScore(newScore);
  };

  const handleTiebreakPoint = (playerIndex: number) => {
    const newScore = { ...score };
    const otherPlayer = playerIndex === 0 ? 1 : 0;
    newScore.points[playerIndex] = (Number(newScore.points[playerIndex]) || 0) + 1;
    if (
      (newScore.points[playerIndex] as number) >= 7 &&
      (newScore.points[playerIndex] as number) - (newScore.points[otherPlayer] as number) >= 2
    ) {
      newScore.games[playerIndex] += 1;
      newScore.sets[playerIndex] += 1;
      newScore.setScores.push([...newScore.games]);
      newScore.points = [0, 0];
      newScore.games = [0, 0];
      newScore.currentSet += 1;
      setTiebreak(false);
      if (newScore.sets[playerIndex] >= setsToWin) setMatchCanBeFinished(true);
    }
    setScore(newScore);
  };

  const checkSetCompletion = (newScore: Score) => {
    const playerIndex = newScore.games[0] > newScore.games[1] ? 0 : 1;
    const otherPlayer = playerIndex === 0 ? 1 : 0;
    if (newScore.games[0] === 6 && newScore.games[1] === 6) {
      setTiebreak(true);
      return;
    }
    if (
      (newScore.games[playerIndex] >= 6 && newScore.games[playerIndex] - newScore.games[otherPlayer] >= 2) ||
      (newScore.games[playerIndex] === 7 && newScore.games[otherPlayer] === 5)
    ) {
      newScore.sets[playerIndex] += 1;
      newScore.setScores.push([...newScore.games]);
      newScore.points = [0, 0];
      newScore.games = [0, 0];
      newScore.currentSet += 1;
      if (newScore.sets[playerIndex] >= setsToWin) setMatchCanBeFinished(true);
    }
  };

  const recordAce = (playerIndex: number) => {
    if (matchFinished || matchCanBeFinished) return;
    const historyItem = {
      action: 'ace',
      playerIndex,
      prevScore: JSON.parse(JSON.stringify(score)),
      prevStats: JSON.parse(JSON.stringify(stats)),
    };
    const newStats = { ...stats };
    newStats.aces[playerIndex] += 1;
    newStats.points[playerIndex] += 1;
    setStats(newStats);
    const newScore = { ...score };
    if (tiebreak) {
      newScore.points[playerIndex] = (Number(newScore.points[playerIndex]) || 0) + 1;
      const otherPlayer = playerIndex === 0 ? 1 : 0;
      if ((newScore.points[playerIndex] as number) >= 7 &&
        (newScore.points[playerIndex] as number) - (newScore.points[otherPlayer] as number) >= 2) {
        newScore.games[playerIndex] += 1;
        newScore.sets[playerIndex] += 1;
        newScore.setScores.push([...newScore.games]);
        newScore.points = [0, 0];
        newScore.games = [0, 0];
        newScore.currentSet += 1;
        setTiebreak(false);
        if (newScore.sets[playerIndex] >= setsToWin) setMatchCanBeFinished(true);
      }
    } else {
      const otherPlayer = playerIndex === 0 ? 1 : 0;
      if (newScore.points[0] === 40 && newScore.points[1] === 40) {
        newScore.points[playerIndex] = 'Ad';
      } else if (newScore.points[playerIndex] === 'Ad') {
        newScore.points = [0, 0];
        newScore.games[playerIndex] += 1;
        checkSetCompletion(newScore);
      } else if (newScore.points[otherPlayer] === 'Ad') {
        newScore.points = [40, 40];
      } else {
        const numericPoints = newScore.points[playerIndex] === 0 ? 0 :
          newScore.points[playerIndex] === 15 ? 1 :
          newScore.points[playerIndex] === 30 ? 2 :
          newScore.points[playerIndex] === 40 ? 3 : 0;
        newScore.points[playerIndex] = convertPoints(numericPoints + 1);
        if (newScore.points[playerIndex] === 'Ad' && newScore.points[otherPlayer] !== 40) {
          newScore.points = [0, 0];
          newScore.games[playerIndex] += 1;
          checkSetCompletion(newScore);
        }
      }
    }
    setScore(newScore);
    setHistory([...history, historyItem]);
  };

  const recordSingleFault = (playerIndex: number) => {
    if (matchFinished || matchCanBeFinished) return;
    const historyItem = {
      action: 'singleFault',
      playerIndex,
      prevScore: JSON.parse(JSON.stringify(score)),
      prevStats: JSON.parse(JSON.stringify(stats)),
    };
    const newStats = { ...stats };
    newStats.singleFaults[playerIndex] += 1;
    setStats(newStats);
    setHistory([...history, historyItem]);
  };

  const recordDoubleFault = (playerIndex: number) => {
    if (matchFinished || matchCanBeFinished) return;
    const historyItem = {
      action: 'doubleFault',
      playerIndex,
      prevScore: JSON.parse(JSON.stringify(score)),
      prevStats: JSON.parse(JSON.stringify(stats)),
    };
    const newStats = { ...stats };
    newStats.doubleFaults[playerIndex] += 1;
    const otherPlayer = playerIndex === 0 ? 1 : 0;
    newStats.points[otherPlayer] += 1;
    const newScore = { ...score };
    if (tiebreak) {
      newScore.points[otherPlayer] = (Number(newScore.points[otherPlayer]) || 0) + 1;
      if ((newScore.points[otherPlayer] as number) >= 7 &&
        (newScore.points[otherPlayer] as number) - (newScore.points[playerIndex] as number) >= 2) {
        newScore.games[otherPlayer] += 1;
        newScore.sets[otherPlayer] += 1;
        newScore.setScores.push([...newScore.games]);
        newScore.points = [0, 0];
        newScore.games = [0, 0];
        newScore.currentSet += 1;
        setTiebreak(false);
        if (newScore.sets[otherPlayer] >= setsToWin) setMatchCanBeFinished(true);
      }
    } else {
      if (newScore.points[0] === 40 && newScore.points[1] === 40) {
        newScore.points[otherPlayer] = 'Ad';
      } else if (newScore.points[otherPlayer] === 'Ad') {
        newScore.points = [0, 0];
        newScore.games[otherPlayer] += 1;
        checkSetCompletion(newScore);
      } else if (newScore.points[playerIndex] === 'Ad') {
        newScore.points = [40, 40];
      } else {
        const numericPoints = newScore.points[otherPlayer] === 0 ? 0 :
          newScore.points[otherPlayer] === 15 ? 1 :
          newScore.points[otherPlayer] === 30 ? 2 :
          newScore.points[otherPlayer] === 40 ? 3 : 0;
        newScore.points[otherPlayer] = convertPoints(numericPoints + 1);
        if (newScore.points[otherPlayer] === 'Ad' && newScore.points[playerIndex] !== 40) {
          newScore.points = [0, 0];
          newScore.games[otherPlayer] += 1;
          checkSetCompletion(newScore);
        }
      }
    }
    setScore(newScore);
    setStats(newStats);
    setHistory([...history, historyItem]);
  };

  // --- UNDO: always restore both score and stats, and update flags ---
  const undoLastAction = () => {
    if (history.length === 0) return;
    const lastAction = history[history.length - 1];
    if (lastAction.prevScore) setScore(lastAction.prevScore);
    if (lastAction.prevStats) setStats(lastAction.prevStats);
    setHistory(history.slice(0, -1));
    if (lastAction.prevScore) {
      setTiebreak(
        lastAction.prevScore.games[0] === 6 && lastAction.prevScore.games[1] === 6
      );
      setMatchFinished(false); // Zawsze false po cofnięciu
      setMatchCanBeFinished(
        lastAction.prevScore.sets[0] >= setsToWin || lastAction.prevScore.sets[1] >= setsToWin
      );
    }
  };

  // --- FINISH: only allow finish if required sets reached, never auto-finish ---
  const finishMatch = () => {
    if (!matchCanBeFinished) return; // nie pozwól zakończyć przed czasem
    setMatchFinished(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {String(playerNames?.[0] ?? '')} vs {String(playerNames?.[1] ?? '')}
          </Text>
          <Text style={styles.subtitle}>
            {`${matchType === 'singiel' ? 'Singiel' : 'Debel'} | ${setsToWin == 1 ? 'Bo1' : setsToWin == 2 ? 'Bo3' : 'Bo5'} | ${place}`}
          </Text>
        </View>
        <View style={styles.scoreContainer}>
          <View style={styles.setScoresContainer}>
            {Array.isArray(score.setScores) && score.setScores.length > 0 ? (
              score.setScores.map((setScore, idx) => (
                <View key={idx} style={styles.setScoreRow}>
                  <Text style={styles.setScoreText}>{`Set #${idx + 1}`}</Text>
                  <Text style={styles.setScoreValue}>{String(setScore?.[0] ?? '')}</Text>
                  <Text style={styles.setScoreValue}>{String(setScore?.[1] ?? '')}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: 'red', textAlign: 'center' }}></Text>
            )}
            {/* Hide current set row if matchCanBeFinished (all sets done) or matchFinished */}
            {!(matchCanBeFinished || matchFinished) && (
              <View style={styles.currentSetRow}>
                <Text style={styles.currentSetText}>{`Set #${score.currentSet + 1}`}</Text>
                <Text style={styles.currentSetValue}>{String(score.games[0])}</Text>
                <Text style={styles.currentSetValue}>{String(score.games[1])}</Text>
              </View>
            )}
            <View style={styles.pointsRow}>
              <Text style={styles.pointsLabel}>{tiebreak ? "Punkty" : "Gemy"}</Text>
              <Text style={styles.pointsValue}>
                {tiebreak ? String(score.points[0]) : pointsDisplay(score.points[0])}
              </Text>
              <Text style={styles.pointsValue}>
                {tiebreak ? String(score.points[1]) : pointsDisplay(score.points[1])}
              </Text>
            </View>
          </View>
        </View>
        {!matchFinished ? (
          <View style={styles.controlsContainer}>
            <View style={styles.playerColumn}>
              <Text style={styles.playerName}>{String(playerNames?.[0] ?? '')}</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => addPoint(0)}>
                <Text style={styles.actionButtonText}>
                  {`Punkt ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[0] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordAce(0)}>
                <Text style={styles.actionButtonText}>
                  {`Ace ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[0] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordSingleFault(0)}>
                <Text style={styles.actionButtonText}>
                  {`Pojedyńczy błąd ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[0] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordDoubleFault(0)}>
                <Text style={styles.actionButtonText}>
                  {`Podwójny błąd ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[0] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <View style={styles.statsContainer}>
                <Text style={styles.statsHeader}>Statystyki:</Text>
                <Text style={styles.statItem}>{`Asy: ${String(stats.aces[0])}`}</Text>
                <Text style={styles.statItem}>{`Pojedyńcze błędy: ${String(stats.singleFaults[0])}`}</Text>
                <Text style={styles.statItem}>{`Podwójne błędy: ${String(stats.doubleFaults[0])}`}</Text>
              </View>
            </View>
            <View style={styles.playerColumn}>
              <Text style={styles.playerName}>{String(playerNames?.[1] ?? '')}</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => addPoint(1)}>
                <Text style={styles.actionButtonText}>
                  {`Punkt ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[1] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordAce(1)}>
                <Text style={styles.actionButtonText}>
                  {`Ace ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[1] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordSingleFault(1)}>
                <Text style={styles.actionButtonText}>
                  {`Pojedyńczy błąd ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[1] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => recordDoubleFault(1)}>
                <Text style={styles.actionButtonText}>
                  {`Podwójny błąd ${matchType === 'debel' ? 'drużyny ' : ''}${String(playerNames?.[1] ?? '')}`}
                </Text>
              </TouchableOpacity>
              <View style={styles.statsContainer}>
                <Text style={styles.statsHeader}>Statystyki:</Text>
                <Text style={styles.statItem}>{`Asy: ${String(stats.aces[1])}`}</Text>
                <Text style={styles.statItem}>{`Pojedyńcze błędy: ${String(stats.singleFaults[1])}`}</Text>
                <Text style={styles.statItem}>{`Podwójne błędy: ${String(stats.doubleFaults[1])}`}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Podsumowanie meczu</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}></Text>
              <Text style={styles.summaryValue}>{String(playerNames?.[0] ?? '')}</Text>
              <Text style={styles.summaryValue}>{String(playerNames?.[1] ?? '')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Asy:</Text>
              <Text style={styles.summaryValue}>{String(stats.aces[0])}</Text>
              <Text style={styles.summaryValue}>{String(stats.aces[1])}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Podwójne błędy:</Text>
              <Text style={styles.summaryValue}>{String(stats.doubleFaults[0])}</Text>
              <Text style={styles.summaryValue}>{String(stats.doubleFaults[1])}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pojedyńcze błędy:</Text>
              <Text style={styles.summaryValue}>{String(stats.singleFaults[0])}</Text>
              <Text style={styles.summaryValue}>{String(stats.singleFaults[1])}</Text>
            </View>
            <Text style={styles.winnerText}>
              {`Wygrywa: ${score.sets[0] > score.sets[1] ? String(playerNames?.[0] ?? '') : String(playerNames?.[1] ?? '')}!`}
            </Text>
          </View>
        )}
        {/* Control buttons */}
        <View style={styles.bottomControls}>
          {!matchFinished && (
            <TouchableOpacity
              style={[styles.undoButton, history.length === 0 && { opacity: 0.5 }]}
              onPress={undoLastAction}
              disabled={history.length === 0}
            >
              <Text style={styles.undoButtonText}>Cofnij</Text>
            </TouchableOpacity>
          )}
          {!matchFinished && (
            <TouchableOpacity
              style={[styles.finishButton, !matchCanBeFinished && { opacity: 0.5 }]}
              onPress={finishMatch}
              disabled={!matchCanBeFinished}
            >
              <Text style={styles.finishButtonText}>Zakończ mecz</Text>
            </TouchableOpacity>
          )}
          {matchFinished && (
            <TouchableOpacity
              style={styles.finishButton}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.finishButtonText}>Zakończ</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  contentContainer: { padding: 16 },
  titleContainer: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', flexWrap: 'wrap' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 4 },
  scoreContainer: { marginVertical: 20 },
  setScoresContainer: { backgroundColor: '#f8f8f8', padding: 16, borderRadius: 8 },
  setScoreRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  setScoreText: { fontSize: 18, flex: 3 },
  setScoreValue: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  currentSetRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 8 },
  currentSetText: { fontSize: 18, flex: 3 },
  currentSetValue: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  pointsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, borderTopWidth: 1, borderTopColor: '#e0e0e0', paddingTop: 12 },
  pointsLabel: { fontSize: 18, flex: 3 },
  pointsValue: { fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  controlsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  playerColumn: { flex: 1, marginHorizontal: 4 },
  playerName: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, flexWrap: 'wrap' },
  actionButton: { backgroundColor: '#e6f7ff', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 8, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontSize: 12, color: '#0066cc', textAlign: 'center', flexWrap: 'wrap' },
  statsContainer: { marginTop: 20, backgroundColor: '#f5f5f5', padding: 10, borderRadius: 8 },
  statsHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  statItem: { fontSize: 14, marginBottom: 4 },
  bottomControls: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30 },
  undoButton: { backgroundColor: '#f0f0f0', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  undoButtonText: { fontSize: 16, color: '#666' },
  finishButton: { backgroundColor: '#4caf50', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  finishButtonText: { fontSize: 16, color: '#fff', fontWeight: 'bold' },
  summaryContainer: { marginVertical: 20, padding: 16, backgroundColor: '#f0f8ff', borderRadius: 8 },
  summaryTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 16, flex: 2 },
  summaryValue: { fontSize: 16, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  winnerText: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginTop: 20, color: '#4caf50' },
});