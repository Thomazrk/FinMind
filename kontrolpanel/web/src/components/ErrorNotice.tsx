import type { AppError } from "../lib/errors";

/** Errors say what broke and what I do about it. Never just "noget gik galt". */
export function ErrorNotice({ error, onRetry }: { error: AppError; onRetry?: () => void }) {
  return (
    <div className="error-notice" role="alert">
      <p className="error-what">{error.whatHappened}</p>
      <p className="error-todo">{error.whatToDo}</p>
      {error.code && <p className="error-code">Kode: {error.code}</p>}
      {onRetry && (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Prøv igen
        </button>
      )}
    </div>
  );
}
