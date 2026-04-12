export const shuffleQuizEntries = <T>(entries: T[], rng: () => number = Math.random): T[] => {
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const pickRandomPromptIndex = (total: number, rng: () => number = Math.random): number => {
  if (total <= 0) return 0;
  return Math.floor(rng() * total);
};
