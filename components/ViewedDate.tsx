export function ViewedDate({ date }: { date: string }) {
  const d = new Date(date);
  const formatted = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
  return <span className="text-xs text-neutral-400">{formatted} 조회</span>;
}
