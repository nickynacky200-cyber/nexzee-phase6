const styles: Record<string, string> = {
  successful: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  failed: "bg-danger/10 text-danger",
  refunded: "bg-nexzee-soft text-nexzee",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`text-[11px] font-semibold px-2 py-0.5 rounded-pill capitalize ${
        styles[status] ?? "bg-ink/5 text-ink-soft"
      }`}
    >
      {status}
    </span>
  );
}
