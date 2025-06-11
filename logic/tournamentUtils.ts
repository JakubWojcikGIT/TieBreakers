import db from '../db';

export async function addTournamentWithMatches(
  place: string,
  playerIds: number[],
  roundsToWin: number
): Promise<number> {
  // Dodaj turniej
  const result = await db.runAsync(
    `INSERT INTO Tournament (tournament_place, single, created_at) VALUES (?, ?, datetime('now'))`,
    [place, true]
  );

  // ID nowo utworzonego turnieju
  const tournamentId = result.lastInsertRowId;

  // Utwórz mecze każdy z każdym
  const matches = generateOptimizedMatchOrder(playerIds);

  let order = 1;
  for (const [player1, player2] of matches) {
    const matchResult = await db.runAsync(
      `INSERT INTO "Match" (match_order, tournament_id) VALUES (?, ?)`,
      [order++, tournamentId]
    );

    const matchId = matchResult.lastInsertRowId;

    // Dodaj graczy do meczu (team_number: 1 i 2)
    await db.runAsync(
      `INSERT INTO MatchPlayer (match_id, player_id, team_number) VALUES (?, ?, ?)`,
      [matchId, player1, 1]
    );
    await db.runAsync(
      `INSERT INTO MatchPlayer (match_id, player_id, team_number) VALUES (?, ?, ?)`,
      [matchId, player2, 2]
    );

    // Wstępnie puste wyniki
    await db.runAsync(
      `INSERT INTO MatchResult (match_id, team1_wins, team2_wins, winner_team_number) VALUES (?, ?, ?, ?)`,
      [matchId, 0, 0, 0]
    );
  }

  return tournamentId;
}

type Match = [number, number];

/**
 * Generuje zoptymalizowaną kolejność meczów (każdy z każdym)
 * przy założeniu jednego kortu i minimalizacji długich przerw.
 */
export function generateOptimizedMatchOrder(players: number[]): Match[] {
  const allMatches: Match[] = [];

  // Generuj wszystkie mecze: każdy z każdym (bez powtórzeń)
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      allMatches.push([players[i], players[j]]);
    }
  }

  const scheduled: Match[] = [];
  const matchPool = [...allMatches];
  const lastPlayed: Record<number, number> = {}; // playerId -> last match index

  let matchIndex = 0;

  while (matchPool.length > 0) {
    // Sortuj mecze tak, by jak najbardziej rozdzielić ostatnich graczy
    matchPool.sort((a, b) => {
      const aPenalty =
        (matchIndex - (lastPlayed[a[0]] ?? -10)) +
        (matchIndex - (lastPlayed[a[1]] ?? -10));
      const bPenalty =
        (matchIndex - (lastPlayed[b[0]] ?? -10)) +
        (matchIndex - (lastPlayed[b[1]] ?? -10));
      return bPenalty - aPenalty;
    });

    const nextMatch = matchPool.shift()!;
    scheduled.push(nextMatch);
    lastPlayed[nextMatch[0]] = matchIndex;
    lastPlayed[nextMatch[1]] = matchIndex;
    matchIndex++;
  }

  return scheduled;
}