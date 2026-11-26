import { useEffect, useRef } from 'react';

export const number = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
});
export const date = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(
    new Date(`${value}T12:00:00`),
  );
export const moment = (value: string) =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
const message = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Connexion au serveur impossible. Réessaie dans un instant.';
export const cell = (value: unknown) =>
  value === null || value === undefined
    ? '—'
    : typeof value === 'boolean'
      ? value
        ? 'Oui'
        : 'Non'
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value);
export function Notice({ error }: { error: unknown }) {
  return error ? (
    <div className="admin-notice admin-notice-error" role="alert">
      {message(error)}
    </div>
  ) : null;
}
export function Dialog({
  title,
  children,
  close,
}: {
  title: string;
  children: React.ReactNode;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      className="admin-dialog"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-label={title}
    >
      <div className="admin-dialog-heading">
        <h2>{title}</h2>
        <button
          className="admin-icon-button"
          type="button"
          onClick={close}
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
