import type {
  ClassicCard,
  ClassicState,
  Criterion,
  Match,
} from '@mtgdle/shared-types';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

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

  async function action(kind: 'guesses' | 'hint' | 'abandon') {
    if (!state || busy || (kind === 'guesses' && !selected)) return;
    setBusy(true);
    setError('');
    try {
      if (kind === 'guesses' && pending.current?.id !== selected)
        pending.current = { id: selected!, requestId: crypto.randomUUID() };
      const body =
        kind === 'guesses'
          ? { cardId: selected, requestId: pending.current!.requestId }
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
        `MTGdle · ${state.day}\n${state.guesses.length} essai(s) · ${state.status === 'won' ? 'Trouvé !' : 'Abandon'}${state.hint.used ? ' · avec indice' : ''}\n${lines.join('\n')}`,
      );
      setCopied(true);
    } catch {
      setError('Le partage nécessite l’accès au presse-papiers.');
    }
  }

  return (
    <div className="classic-game">
      <header className="classic-hero">
        <div className="classic-eyebrow">
          <span className="classic-dot" /> LE DÉFI QUOTIDIEN · CLASSIQUE
        </div>
        <h1>
          Une carte. <em>À toi de la trouver.</em>
        </h1>
        <p>
          Explore le multivers, une proposition à la fois. Chaque carte révèle
          de nouveaux indices.
        </p>
        <div className="classic-meta">
          <span>{state?.day || 'Aujourd’hui'} · Europe/Paris</span>
          <span>Essais illimités</span>
          <span>7 critères</span>
        </div>
      </header>
      {game.isPending && (
        <p className="classic-panel" role="status">
          Ouverture du grimoire…
        </p>
      )}
      {game.isError && !state && (
        <div className="classic-panel" role="alert">
          <p>Impossible de charger le défi.</p>
          <button onClick={() => void game.refetch()}>Réessayer</button>
        </div>
      )}
      {state && (
        <>
          <section
            aria-label="Partie du jour"
            className="classic-panel classic-play"
          >
            <div className="classic-section-heading">
              <div>
                <span className="classic-eyebrow">TA PROCHAINE PISTE</span>
                <h2>
                  {state.status === 'playing'
                    ? 'Quelle carte proposes-tu ?'
                    : state.status === 'won'
                      ? 'Le multivers n’a plus de secrets.'
                      : 'Une nouvelle découverte.'}
                </h2>
              </div>
              <div className="classic-count">
                <strong>{state.guesses.length}</strong>
                <span>essai{state.guesses.length > 1 ? 's' : ''}</span>
              </div>
            </div>
            {state.status === 'playing' ? (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void action('guesses');
                  }}
                >
                  <label htmlFor="card-search">Nom de la carte (anglais)</label>
                  <div className="classic-search-row">
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
                        placeholder="Ex. Path to Exile"
                        role="combobox"
                        value={query}
                        onChange={(e) => {
                          setQuery(e.target.value);
                          setSelected(null);
                          setActive(0);
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
                          }
                          if (
                            e.key === 'Enter' &&
                            !selected &&
                            suggestions[active]
                          ) {
                            e.preventDefault();
                            const c = suggestions[active];

                            choose(c.id, c.name);
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
                              onClick={() => choose(c.id, c.name)}
                              onKeyDown={(event) => {
                                if (
                                  event.key === 'Enter' ||
                                  event.key === ' '
                                ) {
                                  event.preventDefault();
                                  choose(c.id, c.name);
                                }
                              }}
                              onMouseDown={(e) => e.preventDefault()}
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
                      {busy ? 'Vérification…' : 'Proposer'}{' '}
                      <span aria-hidden="true">↗</span>
                    </button>
                  </div>
                  {query && !selected && !suggestions.length && (
                    <p className="classic-muted" role="status">
                      Aucune carte disponible avec ce nom.
                    </p>
                  )}
                </form>
                <div className="classic-assistance">
                  <p>
                    {state.hint.used
                      ? `Indice utilisé : ${state.hint.removed} cartes retirées.`
                      : state.hint.available
                        ? 'Besoin d’un coup de pouce ? Retire la moitié des choix restants.'
                        : `L’indice se débloque après 10 erreurs (${Math.min(state.guesses.length, 10)}/10).`}
                  </p>
                  <button
                    disabled={busy || !state.hint.available}
                    onClick={() => void action('hint')}
                  >
                    Utiliser l’indice
                  </button>
                </div>
                <div className="classic-quiet">
                  {choices.length} cartes disponibles · Une carte jouée ne peut
                  pas être rejouée.
                </div>
              </>
            ) : (
              <div className="classic-result" role="status">
                {state.answer?.image && (
                  <img alt={state.answer.name} src={state.answer.image} />
                )}
                <div>
                  <span className="classic-eyebrow">
                    {state.status === 'won'
                      ? 'BIEN JOUÉ !'
                      : 'LA CARTE DU JOUR'}
                  </span>
                  <h3>{state.answer?.name}</h3>
                  <p>
                    {state.guesses.length} essai(s)
                    {state.hint.used ? ' · avec indice' : ' · sans indice'}
                  </p>
                  <button
                    className="classic-primary"
                    onClick={() => void share()}
                  >
                    {copied ? 'Résultat copié ✓' : 'Partager mon résultat'}
                  </button>
                  <p className="classic-muted">
                    Prochain défi à minuit, heure de Paris.
                  </p>
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
              <h2>Tes explorations</h2>
              <span className="classic-muted">
                ✓ Exact · ≈ Partiel · ↑ / ↓ Plus / moins
              </span>
            </div>
            {!state.guesses.length ? (
              <div className="classic-empty">
                <span aria-hidden="true">✧</span>
                <p>Tout commence par une intuition.</p>
                <small>
                  Choisis une première carte pour découvrir les indices.
                </small>
              </div>
            ) : (
              <div className="classic-table-scroll">
                <table>
                  <caption className="sr-only">
                    Comparaisons avec la carte du jour
                  </caption>
                  <thead>
                    <tr>
                      <th>Carte proposée</th>
                      {labels.map(([key, label]) => (
                        <th key={key}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...state.guesses].reverse().map((g) => (
                      <tr key={g.requestId}>
                        <th scope="row">{g.card.name}</th>
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
          <details className="classic-rules">
            <summary>Comment lire les indices ?</summary>
            <p>
              Les couleurs comparées sont l’identité couleur, y compris les
              symboles pertinents du texte de règles. La valeur de mana est
              comparée avec ↑ ou ↓. La période correspond à une tranche de deux
              ans. Les types et mots-clés peuvent correspondre partiellement.
            </p>
            <p>
              Miniatures : premier artwork standard disponible dans le catalogue
              source. Les noms et mots-clés restent en anglais pour ce premier
              jet. Les capacités activées sont détectées automatiquement et
              peuvent nécessiter des corrections sur des cartes particulières.
            </p>
            <p>
              Les propositions sont sauvegardées dans ce navigateur grâce à une
              session anonyme. Effacer les cookies fait perdre l’accès à cette
              progression.
            </p>
          </details>
          {state.status === 'playing' && (
            <div className="classic-abandon">
              {confirmAbandon ? (
                <>
                  <span>Révéler la carte terminera ta partie.</span>
                  <button
                    disabled={busy}
                    onClick={() => void action('abandon')}
                  >
                    Confirmer l’abandon
                  </button>
                  <button onClick={() => setConfirmAbandon(false)}>
                    Continuer à chercher
                  </button>
                </>
              ) : (
                <button onClick={() => setConfirmAbandon(true)}>
                  Abandonner et révéler la carte
                </button>
              )}
            </div>
          )}
        </>
      )}
      <footer className="classic-credit">
        Un rendez-vous quotidien dans le multivers. Données et illustrations :
        Scryfall / Wizards of the Coast.
      </footer>
    </div>
  );
};
