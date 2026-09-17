const NARROW_NO_BREAK_SPACE = " ";

export function formatXof(amount: number): string {
  const grouped = Math.round(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NARROW_NO_BREAK_SPACE);
  return amount < 0 ? `-${grouped}` : grouped;
}

export const MASKED_AMOUNT = "•••••";
