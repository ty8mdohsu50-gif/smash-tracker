export const MILESTONES = [
  { id: "rookie", label: "ルーキー", condition: "10戦達成", matchCount: 10 },
  { id: "fighter", label: "ファイター", condition: "50戦達成", matchCount: 50 },
  { id: "veteran", label: "ベテラン", condition: "100戦達成", matchCount: 100 },
  { id: "master", label: "マスター", condition: "500戦達成", matchCount: 500 },
  { id: "legend", label: "レジェンド", condition: "1000戦達成", matchCount: 1000 },
];

export const STREAK_MILESTONES = [
  { id: "hot_streak", label: "ホットストリーク", streakCount: 5 },
  { id: "unstoppable", label: "アンストッパブル", streakCount: 10 },
];

export const WINRATE_MILESTONES = [
  { id: "ace", label: "エース", minMatches: 50, minWinRate: 60 },
  { id: "champion", label: "チャンピオン", minMatches: 100, minWinRate: 70 },
];

/**
 * Returns newly achieved milestones by comparing previous and current state.
 * @param {number} prevMatchCount - match count before this match
 * @param {number} newMatchCount - match count after this match
 * @param {{ type: string|null, count: number }} streak - current streak
 * @param {number} winRate - current win rate (0-100)
 * @returns {Array<{ id: string, label: string, condition: string }>}
 */
export function checkMilestones(prevMatchCount, newMatchCount, streak, winRate) {
  const achieved = [];

  for (const m of MILESTONES) {
    if (prevMatchCount < m.matchCount && newMatchCount >= m.matchCount) {
      achieved.push({ id: m.id, label: m.label, condition: m.condition });
    }
  }

  if (streak.type === "win") {
    for (const m of STREAK_MILESTONES) {
      if (streak.count === m.streakCount) {
        achieved.push({ id: m.id, label: m.label, condition: `${m.streakCount}連勝達成` });
      }
    }
  }

  for (const m of WINRATE_MILESTONES) {
    if (prevMatchCount < m.minMatches && newMatchCount >= m.minMatches && winRate >= m.minWinRate) {
      achieved.push({ id: m.id, label: m.label, condition: `勝率${m.minWinRate}%達成（${m.minMatches}戦以上）` });
    }
    if (
      prevMatchCount >= m.minMatches &&
      newMatchCount >= m.minMatches &&
      winRate >= m.minWinRate
    ) {
      const prevWins = Math.round((prevMatchCount * winRate) / 100);
      const prevWinRate = prevMatchCount > 0 ? Math.round((prevWins / prevMatchCount) * 100) : 0;
      if (prevWinRate < m.minWinRate) {
        achieved.push({ id: m.id, label: m.label, condition: `勝率${m.minWinRate}%達成（${m.minMatches}戦以上）` });
      }
    }
  }

  return achieved;
}
