import type {
  ClassicCard,
  ClassicState,
  Criterion,
  Match,
  HintKind,
} from '@mtgdle/shared-types';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useCardViewer } from './card-viewer';

import { env } from '@/config/env.validation';

import './classic.css';

async function request(path: string, body?: object): Promise<ClassicState> {
  const response = await fetch(`${env.API_URL}/classic/${path}`, {
    credentials: 'include',
    signal: AbortSignal.timeout(10000),
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as {
      message?: string | string[];
    };

    throw new Error(
      Array.isArray(error.message)
        ? error.message.join(', ')
        : error.message ||
          'Le serveur est indisponible. Réessaie dans un instant.',
    );
  }

  return response.json() as Promise<ClassicState>;
}

const labels: [Criterion, string][] = [
  ['identity', 'Identité'],
  ['mana', 'Mana'],
  ['types', 'Types'],
  ['edition', 'Première édition'],
  ['period', 'Période'],
  ['keywords', 'Mots-clés'],
  ['activated', 'Capacité activée'],
];
const symbols: Record<Match, string> = {
  exact: '✓',
  partial: '≈',
  different: '×',
  higher: '↑',
  lower: '↓',
};
const meanings: Record<Match, string> = {
  exact: 'Correspondance exacte',
  partial: 'Correspondance partielle',
  different: 'Différent',
  higher: 'La cible a une valeur supérieure',
  lower: 'La cible a une valeur inférieure',
};
const colorNames: Record<string, string> = {
  W: 'Blanc',
  U: 'Bleu',
  B: 'Noir',
  R: 'Rouge',
  G: 'Vert',
};

function value(card: ClassicCard, key: Criterion): string {
  if (key === 'identity')
    return (
      card.identity.map((c) => colorNames[c] || c).join(' · ') || 'Incolore'
    );
  if (key === 'period') {
    const year = 2 * Math.floor(Number(card.released.slice(0, 4)) / 2);

    return `${year}–${year + 1}`;
  }
  if (key === 'activated') return card.activated ? 'Oui' : 'Non';
  if (key === 'types' || key === 'keywords')
    return card[key].join(' · ') || 'Aucun';

  return String(card[key]);
}

export const GameView = () => {
  const client = useQueryClient();
  const viewer = useCardViewer();
  const [artError, setArtError] = useState(false);
  const [artRetry, setArtRetry] = useState(0);
  const game = useQuery({
    queryKey: ['classic'],
    queryFn: () => request('today'),
    refetchInterval: 60000,
    retry: false,
  });
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [copied, setCopied] = useState(false);
  const pending = useRef<{ id: string; requestId: string } | null>(null);
  const state = game.data;

  useEffect(() => {
    setSelected(null);
    setQuery('');
  }, [state?.day]);
  const choices = state?.choices ?? [];
  const suggestions =
    query && !selected
      ? choices
          .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 8)
      : [];

  async function action(
    kind: 'guesses' | 'hint' | 'abandon',
    hintKind?: HintKind,
  ) {
    if (!state || busy || (kind === 'guesses' && !selected)) return;
    setBusy(true);
    setError('');
    try {
      if (kind === 'guesses' && pending.current?.id !== selected)
        pending.current = { id: selected!, requestId: crypto.randomUUID() };
      const body =
        kind === 'guesses'
          ? { cardId: selected, requestId: pending.current!.requestId }
          : kind === 'hint'
            ? { kind: hintKind || 'reduce' }
            : {};
      const result = await request(`${state.day}/${kind}`, body);

      client.setQueryData(['classic'], result);
      setQuery('');
      setSelected(null);
      setConfirmAbandon(false);
      pending.current = null;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Erreur réseau. Tu peux réessayer.',
      );
      // Refresh authoritative choices, retaining the request ID for a lost response.
      void client.invalidateQueries({ queryKey: ['classic'] });
    } finally {
      setBusy(false);
    }
  }
  function choose(id: string, name: string) {
    setSelected(id);
    setQuery(name);
    setActive(0);
  }
  async function share() {
    if (!state) return;
    const lines = state.guesses.map((g) =>
      labels
        .map(([key]) =>
          g.matches[key] === 'exact'
            ? '🟩'
            : g.matches[key] === 'partial'
              ? '🟨'
              : '⬛',
        )
        .join(''),
    );

    try {
      await navigator.clipboard.writeText(
        `MTGdle · ${state.day}\n${state.guesses.length} essai(s) · ${state.status === 'won' ? 'Trouvé !' : 'Abandon'}${state.hints.some((h) => h.used) ? ' · avec indice' : ''}\n${lines.join('\n')}`,
      );
      setCopied(true);
    } catch {
      setError('Le partage nécessite l’accès au presse-papiers.');
    }
  }

  const chosen = choices.find((c) => c.id === selected);
  const hintLabels: Record<HintKind, string> = {
    reduce: 'Réduire les choix',
    art: 'Illustration',
    text: 'Texte de règles',
  };
  const artUrl = state ? `${env.API_URL}/classic/${state.day}/art` : '';

  return (
    <div className="classic-game">
      <header className="classic-topbar">
        <h1>
          MTGdle <span>Classique</span>
        </h1>
        <output
          aria-label={`${state?.guesses.length || 0} essais`}
          title="Nombre d’essais"
        >
          {state?.guesses.length || 0}
        </output>
      </header>
      {game.isPending && (
        <p className="classic-muted" role="status">
          Chargement…
        </p>
      )}
      {game.isError && !state && (
        <div className="classic-error" role="alert">
          Impossible de charger le défi.{' '}
          <button onClick={() => void game.refetch()}>Réessayer</button>
        </div>
      )}
      {state && (
        <>
          <section
            aria-label="Partie du jour"
            className="classic-panel classic-play"
          >
            <div aria-label="Indices" className="classic-hints">
              {state.hints.map((hint, index) => (
                <button
                  key={hint.kind}
                  aria-label={`Indice ${index + 1} : ${hintLabels[hint.kind]}`}
                  className={`classic-hint ${hint.used ? 'is-used' : ''}`}
                  disabled={busy || !hint.available}
                  title={
                    hint.used
                      ? 'Indice déjà révélé'
                      : `Disponible après ${hint.threshold} erreurs`
                  }
                  onClick={() => void action('hint', hint.kind)}
                >
                  <span className="classic-hint-number">
                    {hint.used ? '✓' : index + 1}
                  </span>
                  <span>
                    {hintLabels[hint.kind]}
                    <small>
                      {hint.used
                        ? hint.kind === 'reduce'
                          ? `${state.hint.removed} cartes retirées`
                          : 'Révélé'
                        : `${hint.threshold} erreurs`}
                    </small>
                  </span>
                </button>
              ))}
            </div>
            {(state.hints.some((h) => h.kind === 'art' && h.used) ||
              state.hints.some((h) => h.kind === 'text' && h.used)) && (
              <div className="classic-hint-content">
                {state.hints.some((h) => h.kind === 'art' && h.used) && (
                  <div className="classic-art-hint">
                    {!artError ? (
                      <button
                        aria-label="Agrandir l’illustration"
                        onClick={() =>
                          viewer.open({
                            name: 'Illustration du jour',
                            image: artUrl,
                          })
                        }
                      >
                        <img
                          alt="Illustration de la carte du jour"
                          src={`${artUrl}?v=${artRetry}`}
                          onError={() => setArtError(true)}
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setArtRetry((v) => v + 1);
                          setArtError(false);
                        }}
                      >
                        Recharger l’illustration
                      </button>
                    )}
                  </div>
                )}
                {state.hints
                  .filter((h) => h.kind === 'text' && h.used)
                  .map((h) => (
                    <p key={h.kind} className="classic-oracle">
                      {h.text}
                    </p>
                  ))}
              </div>
            )}
            {state.status === 'playing' ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  viewer.hide();
                  void action('guesses');
                }}
              >
                <label className="sr-only" htmlFor="card-search">
                  Nom de la carte (anglais)
                </label>
                <div className="classic-search-row">
                  {chosen?.image && (
                    <button
                      aria-label={`Agrandir ${chosen.name}`}
                      className="classic-selected-card"
                      type="button"
                      onBlur={viewer.hide}
                      onClick={() => viewer.open(chosen)}
                      onFocus={(e) => viewer.peek(chosen, e.currentTarget)}
                      onMouseEnter={(e) => viewer.peek(chosen, e.currentTarget)}
                      onMouseLeave={viewer.hide}
                    >
                      <img alt={chosen.name} src={chosen.image} />
                    </button>
                  )}
                  <div className="classic-search">
                    <input
                      aria-activedescendant={
                        suggestions[active] ? `choice-${active}` : undefined
                      }
                      aria-autocomplete="list"
                      aria-controls="card-options"
                      aria-expanded={suggestions.length > 0}
                      autoComplete="off"
                      disabled={busy}
                      id="card-search"
                      placeholder="Chercher une carte…"
                      role="combobox"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setSelected(null);
                        setActive(0);
                        viewer.hide();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActive((a) =>
                            Math.min(a + 1, suggestions.length - 1),
                          );
                        }
                        if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActive((a) => Math.max(a - 1, 0));
                        }
                        if (e.key === 'Escape') {
                          setQuery('');
                          setSelected(null);
                          viewer.hide();
                        }
                        if (
                          e.key === 'Enter' &&
                          !selected &&
                          suggestions[active]
                        ) {
                          e.preventDefault();
                          const c = suggestions[active];

                          choose(c.id, c.name);
                          viewer.hide();
                        }
                      }}
                    />
                    {suggestions.length > 0 && (
                      <ul
                        aria-label="Cartes possibles"
                        id="card-options"
                        role="listbox"
                      >
                        {suggestions.map((c, index) => (
                          <li
                            key={c.id}
                            aria-selected={index === active}
                            id={`choice-${index}`}
                            role="option"
                            onClick={() => {
                              choose(c.id, c.name);
                              viewer.hide();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                choose(c.id, c.name);
                                viewer.hide();
                              }
                            }}
                            onMouseDown={(e) => e.preventDefault()}
                            onMouseEnter={(e) =>
                              viewer.peek(c, e.currentTarget)
                            }
                            onMouseLeave={viewer.hide}
                          >
                            {c.image && (
                              <img alt="" loading="lazy" src={c.image} />
                            )}
                            <span>{c.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    className="classic-primary"
                    disabled={!selected || busy}
                    type="submit"
                  >
                    {busy ? '…' : 'Proposer'} <span aria-hidden="true">↗</span>
                  </button>
                </div>
                {query && !selected && !suggestions.length && (
                  <p className="classic-muted" role="status">
                    Aucune carte disponible.
                  </p>
                )}
              </form>
            ) : (
              <div className="classic-result" role="status">
                {state.answer?.image && (
                  <button
                    aria-label={`Agrandir ${state.answer.name}`}
                    className="classic-result-card"
                    onClick={() => viewer.open(state.answer!)}
                  >
                    <img alt={state.answer.name} src={state.answer.image} />
                  </button>
                )}
                <div>
                  <span className="classic-eyebrow">
                    {state.status === 'won'
                      ? 'BIEN JOUÉ !'
                      : 'LA CARTE DU JOUR'}
                  </span>
                  <h3>{state.answer?.name}</h3>
                  <button
                    className="classic-primary"
                    onClick={() => void share()}
                  >
                    {copied ? 'Copié ✓' : 'Partager mon résultat'}
                  </button>
                </div>
              </div>
            )}
          </section>
          {error && (
            <p className="classic-error" role="alert">
              {error}
            </p>
          )}
          <section
            aria-label="Historique des essais"
            className="classic-history"
          >
            <div className="classic-section-heading">
              <h2>Explorations</h2>
              <span
                className="classic-muted"
                title="Exact · Partiel · Plus / moins"
              >
                ✓ · ≈ · ↑ ↓
              </span>
            </div>
            {!state.guesses.length ? (
              <p className="classic-empty">Aucune proposition.</p>
            ) : (
              <div className="classic-table-scroll">
                <table>
                  <caption className="sr-only">
                    Comparaisons avec la carte du jour
                  </caption>
                  <thead>
                    <tr>
                      <th>Carte</th>
                      {labels.map(([key, label]) => (
                        <th key={key}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...state.guesses].reverse().map((g) => (
                      <tr key={g.requestId}>
                        <th scope="row">
                          <button
                            aria-label={
                              g.card.image
                                ? `Agrandir ${g.card.name}`
                                : g.card.name
                            }
                            className="classic-history-card"
                            disabled={!g.card.image}
                            onBlur={viewer.hide}
                            onClick={() => viewer.open(g.card)}
                            onFocus={(e) =>
                              viewer.peek(g.card, e.currentTarget)
                            }
                            onMouseEnter={(e) =>
                              viewer.peek(g.card, e.currentTarget)
                            }
                            onMouseLeave={viewer.hide}
                          >
                            {g.card.image && (
                              <img alt="" loading="lazy" src={g.card.image} />
                            )}
                            <span>{g.card.name}</span>
                          </button>
                        </th>
                        {labels.map(([key]) => (
                          <td key={key}>
                            <div
                              className={`classic-cell classic-${g.matches[key]}`}
                            >
                              <span
                                aria-label={meanings[g.matches[key]]}
                                className="classic-symbol"
                              >
                                {symbols[g.matches[key]]}
                              </span>
                              <span>{value(g.card, key)}</span>
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
          <div className="classic-bottom">
            <details className="classic-rules">
              <summary>Règles</summary>
              <p>
                Essais illimités. Identité couleur, mana, types, première
                édition, période de deux ans, mots-clés et capacité activée. ✓
                Exact · ≈ Partiel · ↑ / ↓ La cible est supérieure / inférieure.
              </p>
              <p>
                Indices facultatifs à 10, 20 et 30 erreurs. Ton historique est
                sauvegardé grâce à un cookie anonyme. Nouveau défi à minuit,
                heure de Paris.
              </p>
            </details>
            {state.status === 'playing' && (
              <div className="classic-abandon">
                {confirmAbandon ? (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => void action('abandon')}
                    >
                      Confirmer l’abandon
                    </button>
                    <button onClick={() => setConfirmAbandon(false)}>
                      Annuler
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmAbandon(true)}>
                    Abandonner et révéler la carte
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <footer className="classic-credit">
        Scryfall · Wizards of the Coast
      </footer>
      {viewer.viewer}
    </div>
  );
};
