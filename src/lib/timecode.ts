/** Parses "hh:mm:ss.s", "mm:ss.s" or "ss.s" into integer milliseconds. */
export function parseTimecode(input: string): number | null {
  const s = input.trim();
  if (!s) return null;
  const parts = s.split(':');
  if (parts.length > 3 || parts.some((p) => !/^\d+(\.\d+)?$/.test(p))) return null;
  const nums = parts.map(Number);
  let seconds = 0;
  for (const n of nums) seconds = seconds * 60 + n;
  return Math.round(seconds * 1000);
}
