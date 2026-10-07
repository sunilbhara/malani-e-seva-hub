/** Monday (IST) of the week containing `now`, as YYYY-MM-DD. */
export function weekStartIst(now = new Date()): string {
  const ist = new Date(now.getTime() + 330 * 60_000);
  const day = ist.getUTCDay(); // 0 = Sunday
  ist.setUTCDate(ist.getUTCDate() - ((day + 6) % 7));
  return ist.toISOString().slice(0, 10);
}
