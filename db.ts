import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('tennis.db'); // Użyj openDatabaseSync

export async function setupDatabase() {
  try {
    // Tworzenie tabel za pomocą execAsync
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Tournament (
        tournament_id INTEGER PRIMARY KEY AUTOINCREMENT,
        tournament_place VARCHAR(42) NOT NULL,
        single BOOLEAN NOT NULL,
        created_at DATETIME NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS Player (
        player_id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name VARCHAR(20) NOT NULL,
        last_name VARCHAR(20) NOT NULL,
        nick_name VARCHAR(30) NOT NULL,
        email VARCHAR(40) NOT NULL,
        home_place VARCHAR(42) NOT NULL,
        created_at DATETIME NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS "Match" (
        match_id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_order INTEGER NOT NULL,
        tournament_id INTEGER NOT NULL,
        FOREIGN KEY (tournament_id) REFERENCES Tournament (tournament_id)
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS MatchPlayer (
        matchp_id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        team_number INTEGER NOT NULL,
        FOREIGN KEY (match_id) REFERENCES "Match" (match_id),
        FOREIGN KEY (player_id) REFERENCES Player (player_id)
      );
    `);

    await db.execAsync(`
  CREATE TABLE IF NOT EXISTS MatchResult (
    match_id INTEGER PRIMARY KEY, -- KLUCZ GŁÓWNY!
    team1_wins INTEGER NOT NULL,
    team2_wins INTEGER NOT NULL,
    winner_team_number INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES "Match" (match_id)
  );
`);


    console.log("✅ Baza danych zainicjalizowana.");
  } catch (err) {
    console.error("❌ Błąd inicjalizacji bazy:", err);
  }
}

export async function addPlayer(
  firstName: string,
  lastName: string,
  nickName: string,
  email: string,
  homePlace: string
) {
  try {
  await db.runAsync(
    `INSERT INTO Player (first_name, last_name, nick_name, email, home_place, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [firstName, lastName, nickName, email, homePlace]
  );
  console.log('Dodano gracza');
  } catch (e) {
    console.error('Błąd dodawania gracza:', e);
  }
}

export async function getPlayers() {
  return await db.getAllAsync('SELECT * FROM Player');
}

export async function deletePlayer(playerId: number) {
  await db.runAsync('DELETE FROM Player WHERE player_id = ?', [playerId]);
}

export async function addTournamentWithMatches(
  place: string,
  playerIds: number[],
  roundsToWin: number
): Promise<number> {
  try {
    const result = await db.runAsync(
      `INSERT INTO Tournament (tournament_place, single, created_at) VALUES (?, ?, datetime('now'))`,
      [place, true]
    );
    const tournamentId = result.lastInsertRowId as number;

    let matchOrder = 1;
    for (let i = 0; i < playerIds.length; i++) {
      for (let j = i + 1; j < playerIds.length; j++) {
        const match = await db.runAsync(
          `INSERT INTO "Match" (match_order, tournament_id) VALUES (?, ?)`,
          [matchOrder++, tournamentId]
        );
        const matchId = match.lastInsertRowId as number;

        await db.runAsync(
          `INSERT INTO MatchPlayer (match_id, player_id, team_number) VALUES (?, ?, 1)`,
          [matchId, playerIds[i]]
        );
        await db.runAsync(
          `INSERT INTO MatchPlayer (match_id, player_id, team_number) VALUES (?, ?, 2)`,
          [matchId, playerIds[j]]
        );
      }
    }
    return tournamentId;
  } catch (err) {
    console.error("addTournamentWithMatches error:", err);
    throw err;
  }
}

export async function getMatchesForTournament(tournamentId: number) {
  return await db.getAllAsync(`
    SELECT m.match_id, m.match_order,
           p1.first_name AS player1_first, p1.nick_name AS player1_nick,
           p2.first_name AS player2_first, p2.nick_name AS player2_nick,
           r.team1_wins, r.team2_wins
    FROM "Match" m
    JOIN MatchPlayer mp1 ON mp1.match_id = m.match_id AND mp1.team_number = 1
    JOIN MatchPlayer mp2 ON mp2.match_id = m.match_id AND mp2.team_number = 2
    JOIN Player p1 ON p1.player_id = mp1.player_id
    JOIN Player p2 ON p2.player_id = mp2.player_id
    LEFT JOIN MatchResult r ON r.match_id = m.match_id
    WHERE m.tournament_id = ?
    ORDER BY m.match_order
  `, [tournamentId]);
}

export async function updateMatchResult(
  matchId: number,
  team1Wins: number,
  team2Wins: number
) {
  const winner = team1Wins > team2Wins ? 1 : 2;
  await db.runAsync(
    `INSERT OR REPLACE INTO MatchResult (match_id, team1_wins, team2_wins, winner_team_number)
     VALUES (?, ?, ?, ?)`,
    [matchId, team1Wins, team2Wins, winner]
  );
}

// Pobierz wszystkie turnieje
export async function getTournaments() {
  return await db.getAllAsync('SELECT * FROM Tournament ORDER BY created_at DESC');
}

// Pobierz mecze dla danego turnieju (możesz rozbudować o dołączenie wyników/graczy)
export async function getMatchesByTournamentId(tournamentId: number) {
  return await db.getAllAsync(`
    SELECT m.match_id, m.match_order,
           r.team1_wins, r.team2_wins
    FROM "Match" m
    LEFT JOIN MatchResult r ON r.match_id = m.match_id
    WHERE m.tournament_id = ?
    ORDER BY m.match_order
  `, [tournamentId]);
}



export async function deleteTournament(tournamentId: number) {
  // Usuń powiązane rekordy
  await db.runAsync('DELETE FROM MatchResult WHERE match_id IN (SELECT match_id FROM "Match" WHERE tournament_id = ?)', [tournamentId]);
  await db.runAsync('DELETE FROM MatchPlayer WHERE match_id IN (SELECT match_id FROM "Match" WHERE tournament_id = ?)', [tournamentId]);
  await db.runAsync('DELETE FROM "Match" WHERE tournament_id = ?', [tournamentId]);
  await db.runAsync('DELETE FROM Tournament WHERE tournament_id = ?', [tournamentId]);
}




export default db;
