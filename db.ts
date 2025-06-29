import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc, query, where } from "firebase/firestore";
import { db } from "./firebaseConfig";
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('pl');

// Dodaj gracza
export type Player = {
  id?: string;
  first_name: string;
  last_name: string;
  nick_name: string;
  profile_image_uri?: string;
  created_at: string;
};

export async function addPlayer(
  firstName: string,
  lastName: string,
  nickName: string,
  profileImageUri?: string
) {
  const player: Player = {
    first_name: firstName,
    last_name: lastName,
    nick_name: nickName,
    profile_image_uri: profileImageUri,
    created_at: dayjs().tz('Europe/Warsaw').format(),
  };
  await addDoc(collection(db, "players"), player);
}

export async function getPlayers(): Promise<Player[]> {
  const snapshot = await getDocs(collection(db, "players"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
}

export async function deletePlayer(playerId: string) {
  await deleteDoc(doc(db, "players", playerId));
}

// Dodaj turniej i mecze
type Tournament = {
  tournament_place: string;
  single: boolean;
  created_at: string;
};

export async function addTournamentWithMatches(
  place: string,
  playerIds: string[],
  roundsToWin: number
): Promise<string> {
  const tournament: Tournament = {
    tournament_place: place,
    single: true,
    created_at: new Date().toISOString(),
  };
  const tournamentRef = await addDoc(collection(db, "tournaments"), tournament);
  let matchOrder = 1;
  for (let i = 0; i < playerIds.length; i++) {
    for (let j = i + 1; j < playerIds.length; j++) {
      const match = {
        match_order: matchOrder++,
        tournament_id: tournamentRef.id,
        players: [playerIds[i], playerIds[j]],
      };
      await addDoc(collection(db, "matches"), match);
    }
  }
  return tournamentRef.id;
}

export async function getMatchesForTournament(tournamentId: string) {
  const q = query(collection(db, "matches"), where("tournament_id", "==", tournamentId));
  const matchesSnapshot = await getDocs(q);
  
  const matchesWithResults = await Promise.all(
    matchesSnapshot.docs.map(async (matchDoc) => {
      const matchData = { id: matchDoc.id, ...matchDoc.data() } as any;
      
      // Pobierz wynik meczu
      const resultDoc = await getDoc(doc(db, "matchResults", matchDoc.id));
      const resultData = resultDoc.exists() ? resultDoc.data() : null;
      
      // Pobierz informacje o graczach
      const playersInfo = await Promise.all(
        (matchData.players || []).map(async (playerId: string) => {
          const playerDoc = await getDoc(doc(db, "players", playerId));
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            return {
              id: playerId,
              name: `${playerData.first_name} ${playerData.last_name}`,
              nick: playerData.nick_name
            };
          }
          return { id: playerId, name: 'Nieznany gracz', nick: 'N/A' };
        })
      );
      
      return {
        ...matchData,
        team1_wins: resultData?.team1_wins,
        team2_wins: resultData?.team2_wins,
        winner_team_number: resultData?.winner_team_number,
        playersInfo
      };
    })
  );
  
  return matchesWithResults;
}

export async function updateMatchResult(
  matchId: string,
  team1Wins: number,
  team2Wins: number
) {
  const winner = team1Wins > team2Wins ? 1 : 2;
  await setDoc(doc(db, "matchResults", matchId), {
    match_id: matchId,
    team1_wins: team1Wins,
    team2_wins: team2Wins,
    winner_team_number: winner,
  });
}

export async function getTournaments() {
  const snapshot = await getDocs(collection(db, "tournaments"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function getMatchesByTournamentId(tournamentId: string) {
  const q = query(collection(db, "matches"), where("tournament_id", "==", tournamentId));
  const matchesSnapshot = await getDocs(q);

  const matchesWithResults = await Promise.all(
    matchesSnapshot.docs.map(async (matchDoc) => {
      const matchData = { id: matchDoc.id, ...matchDoc.data() } as any;

      // Pobierz wynik meczu
      const resultDoc = await getDoc(doc(db, "matchResults", matchDoc.id));
      const resultData = resultDoc.exists() ? resultDoc.data() : null;

      // Obsługa debla (teams)
      let teamsInfo = undefined;
      if (matchData.teams && Array.isArray(matchData.teams)) {
        teamsInfo = await Promise.all(
          matchData.teams.map(async (team: any) => {
            if (team.players && Array.isArray(team.players)) {
              const players = await Promise.all(
                team.players.map(async (playerId: string) => {
                  const playerDoc = await getDoc(doc(db, "players", playerId));
                  if (playerDoc.exists()) {
                    const playerData = playerDoc.data();
                    return `${playerData.first_name} ${playerData.last_name}`;
                  }
                  return 'Nieznany gracz';
                })
              );
              return players.join(' / ');
            }
            return 'Nieznana drużyna';
          })
        );
      }

      // Pobierz informacje o graczach (singiel)
      const playersInfo = await Promise.all(
        (matchData.players || []).map(async (playerId: string) => {
          const playerDoc = await getDoc(doc(db, "players", playerId));
          if (playerDoc.exists()) {
            const playerData = playerDoc.data();
            return {
              id: playerId,
              name: `${playerData.first_name} ${playerData.last_name}`,
              nick: playerData.nick_name
            };
          }
          return { id: playerId, name: 'Nieznany gracz', nick: 'N/A' };
        })
      );

      return {
        ...matchData,
        team1_wins: resultData?.team1_wins,
        team2_wins: resultData?.team2_wins,
        winner_team_number: resultData?.winner_team_number,
        playersInfo,
        teamsInfo, // dodane!
      };
    })
  );

  return matchesWithResults;
}

export async function deleteTournament(tournamentId: string) {
  // Usuń mecze
  const matchesQ = query(collection(db, "matches"), where("tournament_id", "==", tournamentId));
  const matchesSnap = await getDocs(matchesQ);
  for (const matchDoc of matchesSnap.docs) {
    await deleteDoc(doc(db, "matches", matchDoc.id));
    await deleteDoc(doc(db, "matchResults", matchDoc.id));
  }
  await deleteDoc(doc(db, "tournaments", tournamentId));
}

export async function addDebelTournamentWithMatches(
  place: string,
  teams: { id: string; players: string[]; name: string }[],
  roundsToWin: number
): Promise<string> {
  const tournament = {
    tournament_place: place,
    single: false,
    created_at: new Date().toISOString(),
  };
  const tournamentRef = await addDoc(collection(db, "tournaments"), tournament);
  let matchOrder = 1;
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const match = {
        match_order: matchOrder++,
        tournament_id: tournamentRef.id,
        teams: [teams[i], teams[j]],
        roundsToWin,
      };
      await addDoc(collection(db, "matches"), match);
    }
  }
  return tournamentRef.id;
}

export default db;
