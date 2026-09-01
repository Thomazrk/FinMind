export function Loading({ what }: { what: string }) {
  return (
    <p className="loading" role="status">
      Henter {what} …
    </p>
  );
}

export function EmptyState({ title, explanation }: { title: string; explanation: string }) {
  return (
    <div className="empty">
      <p className="empty-title">{title}</p>
      <p className="empty-explanation">{explanation}</p>
    </div>
  );
}
