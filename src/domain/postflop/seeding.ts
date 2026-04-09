export const createSequenceSeedGenerator = (initialValue: number = Date.now()) => {
  let value = initialValue;
  return () => {
    value += 1;
    return `session-${value}`;
  };
};
