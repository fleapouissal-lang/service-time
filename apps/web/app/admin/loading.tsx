export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-muted/20" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-2xl border border-[var(--card-border)] bg-muted/10"
          />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl border border-[var(--card-border)] bg-muted/10" />
    </div>
  );
}
