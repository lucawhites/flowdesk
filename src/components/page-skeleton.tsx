export function PageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="mx-auto flex max-w-4xl animate-pulse flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="h-7 w-48 rounded-lg bg-surface-muted" />
        <div className="h-4 w-64 rounded-lg bg-surface-muted" />
      </div>
      <div className="h-10 w-full max-w-xs rounded-xl bg-surface-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-border bg-surface-muted/60" />
        ))}
      </div>
    </div>
  );
}
