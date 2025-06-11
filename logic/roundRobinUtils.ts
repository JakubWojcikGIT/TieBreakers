export type Match = {
  player1: number;
  player2: number;
  round: number;
};

/**
 * Tworzy harmonogram "każdy z każdym" z podziałem na rundy.
 * Obsługuje parzystą i nieparzystą liczbę graczy.
 * Przy jednej pauzie zawodnicy pauzują równo.
 */
export function generateRoundRobinSchedule(players: number[]): Match[] {
  const totalPlayers = players.length;
  const isOdd = totalPlayers % 2 !== 0;

  const playerList = [...players];
  if (isOdd) {
    playerList.push(-1); // -1 oznacza pauzę
  }

  const rounds = playerList.length - 1;
  const half = playerList.length / 2;
  const schedule: Match[] = [];

  for (let round = 0; round < rounds; round++) {
    for (let i = 0; i < half; i++) {
      const p1 = playerList[i];
      const p2 = playerList[playerList.length - 1 - i];

      if (p1 !== -1 && p2 !== -1) {
        schedule.push({ player1: p1, player2: p2, round: round + 1 });
      }
    }

    // Rotacja (pierwszy gracz zostaje, reszta rotuje w prawo)
    const fixed = playerList[0];
    const rotated = playerList.slice(1);
    rotated.unshift(rotated.pop()!); // przesuń w prawo
    playerList.splice(1, playerList.length - 1, ...rotated);
  }

  return schedule;
}