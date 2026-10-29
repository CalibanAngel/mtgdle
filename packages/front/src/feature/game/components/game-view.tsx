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
import { useI18n, LanguageSwitch, isTranslationKey } from '@/i18n';
import { ThemeSwitch } from '@/components/theme-switch';
import { GithubIcon } from '@/components/icons';
import { siteConfig } from '@/config/site';

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
      code?: string;
    };

    throw new Error(
      error.code && isTranslationKey(error.code)
        ? error.code
        : response.status === 400
          ? 'errorRequest'
          : 'errorNetwork',
    );
  }

  return response.json() as Promise<ClassicState>;
}

const criteria: Criterion[] = [
  'identity',
  'mana',
  'types',
  'edition',
  'period',
  'keywords',
  'activated',
];
const symbols: Record<Match, string> = {
  exact: '✓',
  partial: '≈',
  different: '×',
  higher: '↑',
  lower: '↓',
};

function value(
  card: ClassicCard,
  key: Criterion,
  t: ReturnType<typeof useI18n>['t'],
): string {
  const colorNames: Record<string, string> = {
    W: t('white'),
    U: t('blue'),
    B: t('black'),
    R: t('red'),
    G: t('green'),
  };

  if (key === 'identity')
    return (
      card.identity.map((c) => colorNames[c] || c).join(' · ') || t('colorless')
    );
  if (key === 'period') {
    const year = 2 * Math.floor(Number(card.released.slice(0, 4)) / 2);

    return `${year}–${year + 1}`;
  }
  if (key === 'activated') return card.activated ? t('yes') : t('no');
  if (key === 'types' || key === 'keywords')
    return card[key].join(' · ') || t('none');

  return String(card[key]);
}

export const GameView = () => {
  const { t } = useI18n();
  const labels = criteria.map((key) => [key, t(key)] as [Criterion, string]);
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
        e instanceof Error && isTranslationKey(e.message)
          ? e.message
          : 'errorNetwork',
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
        `MTGdle · ${state.day}\n${t('shareResult', { count: state.guesses.length, result: t(state.status === 'won' ? 'shareWon' : 'shareAbandoned'), hint: state.hints.some((h) => h.used) ? t('withHint') : '' })}\n${lines.join('\n')}`,
      );
      setCopied(true);
    } catch {
      setError('errorClipboard');
    }
  }

  const chosen = choices.find((c) => c.id === selected);
  const hintLabels: Record<HintKind, string> = {
    reduce: t('reduce'),
    art: t('art'),
    text: t('text'),
  };
  const artUrl = state ? `${env.API_URL}/classic/${state.day}/art` : '';

  return (
    <div className="classic-game">
      <header className="classic-topbar">
        <h1>MTGdle</h1>
        <div className="classic-mana-cost">
          <LanguageSwitch />
          <a
            aria-label="GitHub"
            className="classic-mana-control"
            href={siteConfig.links.github}
            rel="noopener noreferrer"
            target="_blank"
            title="GitHub"
          >
            <GithubIcon size={20} />
          </a>
          <span className="classic-mana-control classic-theme-control">
            <ThemeSwitch />
          </span>
        </div>
      </header>
      {game.isPending && (
        <p className="classic-muted" role="status">
          {t('loading')}
        </p>
      )}
      {game.isError && !state && (
        <div className="classic-error" role="alert">
          {t('loadError')}{' '}
          <button onClick={() => void game.refetch()}>{t('retry')}</button>
        </div>
      )}
      {state && (
        <>
          <section
            aria-label={t('classic')}
            className="classic-panel classic-play"
          >
            <div aria-label={t('hints')} className="classic-hints">
              {state.hints.map((hint, index) => (
                <button
                  key={hint.kind}
                  aria-label={t('hintLabel', {
                    number: index + 1,
                    label: hintLabels[hint.kind],
                  })}
                  className={`classic-hint ${hint.used ? 'is-used' : ''}`}
                  disabled={busy || !hint.available}
                  title={
                    hint.used
                      ? t('hintUsed')
                      : t('hintThreshold', { count: hint.threshold })
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
                          ? t('removed', { count: state.hint.removed })
                          : t('revealed')
                        : t('errors', { count: hint.threshold })}
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
                        aria-label={t('enlargeArt')}
                        onClick={() =>
                          viewer.open({
                            name: t('artOfDay'),
                            image: artUrl,
                          })
                        }
                      >
                        <img
                          alt={t('artAlt')}
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
                        {t('reloadArt')}
                      </button>
                    )}
                  </div>
                )}
                {state.hints
                  .filter((h) => h.kind === 'text' && h.used)
                  .map((h) => (
                    <p key={h.kind} className="classic-oracle">
                      {h.text === 'Aucun texte de règles.'
                        ? t('noRulesText')
                        : h.text?.replaceAll(
                            '[cette carte]',
                            t('cardReference'),
                          )}
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
                  {t('cardName')}
                </label>
                <div className="classic-search-row">
                  {chosen?.image && (
                    <button
                      aria-label={t('enlarge', { name: chosen.name })}
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
                      placeholder={t('search')}
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
                        aria-label={t('possibleCards')}
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
                    {busy ? '…' : t('submit')}{' '}
                    <span aria-hidden="true">↗</span>
                  </button>
                </div>
                {query && !selected && !suggestions.length && (
                  <p className="classic-muted" role="status">
                    {t('noCards')}
                  </p>
                )}
              </form>
            ) : (
              <div className="classic-result" role="status">
                {state.answer?.image && (
                  <button
                    aria-label={t('enlarge', { name: state.answer.name })}
                    className="classic-result-card"
                    onClick={() => viewer.open(state.answer!)}
                  >
                    <img alt={state.answer.name} src={state.answer.image} />
                  </button>
                )}
                <div>
                  <span className="classic-eyebrow">
                    {state.status === 'won' ? t('won') : t('answer')}
                  </span>
                  <h3>{state.answer?.name}</h3>
                  <button
                    className="classic-primary"
                    onClick={() => void share()}
                  >
                    {copied ? t('copied') : t('share')}
                  </button>
                </div>
              </div>
            )}
          </section>
          {error && (
            <p className="classic-error" role="alert">
              {isTranslationKey(error) ? t(error) : t('errorNetwork')}
            </p>
          )}
          <section aria-label={t('history')} className="classic-history">
            <div className="classic-section-heading">
              <h2>{t('gameType')}</h2>
              <span className="classic-muted" title={t('legend')}>
                ✓ · ≈ · ↑ ↓
              </span>
            </div>
            {!state.guesses.length ? (
              <p className="classic-empty">{t('noGuesses')}</p>
            ) : (
              <div className="classic-table-scroll">
                <table>
                  <caption className="sr-only">{t('comparison')}</caption>
                  <thead>
                    <tr>
                      <th>{t('card')}</th>
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
                                ? t('enlarge', { name: g.card.name })
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
                                aria-label={t(g.matches[key])}
                                className="classic-symbol"
                              >
                                {symbols[g.matches[key]]}
                              </span>
                              <span>{value(g.card, key, t)}</span>
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
              <summary>{t('rules')}</summary>
              <p>{t('rulesBody')}</p>
              <p>{t('rulesHints')}</p>
            </details>
            {state.status === 'playing' && (
              <div className="classic-abandon">
                {confirmAbandon ? (
                  <>
                    <button
                      disabled={busy}
                      onClick={() => void action('abandon')}
                    >
                      {t('confirmAbandon')}
                    </button>
                    <button onClick={() => setConfirmAbandon(false)}>
                      {t('cancel')}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmAbandon(true)}>
                    {t('abandon')}
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
      <footer className="classic-credit">
        <span>
          <a
            href="https://scryfall.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Scryfall
          </a>{' '}
          ·{' '}
          <a
            href="https://magic.wizards.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            Wizards of the Coast
          </a>
        </span>
        <output
          aria-label={t('attempts', { count: state?.guesses.length || 0 })}
          className="classic-power"
          title={t('attemptCount')}
        >
          {state?.guesses.length || 0}
          <span aria-hidden="true"> / ∞</span>
        </output>
      </footer>
      {viewer.viewer}
    </div>
  );
};
