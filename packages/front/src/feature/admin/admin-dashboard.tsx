import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminHealth, AdminStatistics } from '@mtgdle/shared-types';
import { adminRequest } from './admin-api';
import { Notice, number, date } from './admin-common';

export function HealthPanel() {
  const health = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => adminRequest<AdminHealth>('health'),
    refetchInterval: 30000,
    retry: false,
  });
  return (
    <section className="admin-health" aria-label="État des services">
      {[
        ['database', 'PostgreSQL'],
        ['scryfall', 'Scryfall'],
      ].map(([key, label]) => {
        const status = health.data?.[key as 'database' | 'scryfall'];
        return (
          <div key={key}>
            <span
              className={`admin-dot ${status === 'up' ? 'is-up' : status === 'down' ? 'is-down' : ''}`}
            />
            <strong>{label}</strong>
            <span>
              {status === 'up'
                ? 'Opérationnel'
                : status === 'down'
                  ? 'Indisponible'
                  : health.isError
                    ? 'Non vérifié'
                    : 'Vérification…'}
            </span>
          </div>
        );
      })}
      <button
        onClick={() => void health.refetch()}
        disabled={health.isFetching}
      >
        Actualiser
      </button>
    </section>
  );
}

export function Statistics({ overview = false }: { overview?: boolean }) {
  const [period, setPeriod] = useState(30);
  const stats = useQuery({
    queryKey: ['admin', 'statistics', period],
    queryFn: () => adminRequest<AdminStatistics>(`statistics?days=${period}`),
    retry: false,
    refetchInterval: 60000,
  });
  const days = stats.data?.days || [];
  const sum = (
    key: 'sessions' | 'players' | 'won' | 'abandoned' | 'winningGuesses',
  ) => days.reduce((total, item) => total + item[key], 0);
  const won = sum('won');
  const players = sum('players');
  const metrics = [
    [
      'Joueurs ayant proposé',
      number.format(players),
      'Cumul des participations quotidiennes',
    ],
    [
      'Parties gagnées',
      number.format(won),
      `${number.format(sum('abandoned'))} abandon(s)`,
    ],
    [
      'Taux de réussite',
      `${number.format(players ? (100 * won) / players : 0)} %`,
      'Parmi les sessions avec une proposition',
    ],
    [
      'Propositions pour gagner',
      won ? number.format(sum('winningGuesses') / won) : '—',
      'Moyenne des parties gagnées',
    ],
  ];
  const chartDays = [...days].reverse();
  const maximum = Math.max(1, ...days.map((day) => day.sessions));
  return (
    <section className="admin-statistics">
      <div className="admin-section-heading">
        <div>
          <h2>{overview ? 'Les 30 derniers jours' : 'Activité du jeu'}</h2>
          <p>
            {stats.data
              ? `Du ${date(stats.data.since)} au ${date(stats.data.until)}`
              : 'Chargement des données…'}
          </p>
        </div>
        {!overview && (
          <label className="admin-inline-label">
            Période
            <select
              aria-label="Période"
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
            >
              <option value={7}>7 jours</option>
              <option value={30}>30 jours</option>
              <option value={90}>90 jours</option>
            </select>
          </label>
        )}
      </div>
      <Notice error={stats.error} />
      <div className="admin-metrics" aria-busy={stats.isFetching}>
        {metrics.map(([label, value, help]) => (
          <article className="admin-metric" key={label}>
            <h3>{label}</h3>
            <strong>{stats.isPending ? '…' : value}</strong>
            <p>{help}</p>
          </article>
        ))}
      </div>
      <div className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Sessions par jour</h2>
            <p>
              Une session est comptée à l’ouverture du défi, même sans
              proposition.
            </p>
          </div>
          <span className="admin-pill">
            {number.format(sum('sessions'))} sessions
          </span>
        </div>
        {!days.length && !stats.isPending ? (
          <p className="admin-empty">
            Aucune partie sur cette période. Les premières visites apparaîtront
            ici.
          </p>
        ) : (
          <div
            className="admin-chart"
            role="img"
            aria-label="Sessions quotidiennes, avec parties gagnées et abandonnées"
          >
            <div className="admin-chart-bars">
              {chartDays.map((day) => (
                <div
                  className="admin-chart-day"
                  key={day.day}
                  title={`${date(day.day)} : ${day.sessions} sessions, ${day.won} gagnées, ${day.abandoned} abandonnées`}
                >
                  <span className="admin-chart-number">{day.sessions}</span>
                  <div
                    className="admin-bar"
                    style={{
                      height: `${Math.max(2, (day.sessions / maximum) * 160)}px`,
                    }}
                  >
                    <span
                      className="admin-bar-won"
                      style={{
                        height: `${day.sessions ? (day.won / day.sessions) * 100 : 0}%`,
                      }}
                    />
                    <span
                      className="admin-bar-abandoned"
                      style={{
                        height: `${day.sessions ? (day.abandoned / day.sessions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <small>{day.day.slice(8)}</small>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="admin-legend">
          <span>
            <i />
            En cours / sans proposition
          </span>
          <span>
            <i className="is-won" />
            Gagnées
          </span>
          <span>
            <i className="is-abandoned" />
            Abandonnées
          </span>
        </div>
      </div>
      {!overview && (
        <>
          <div className="admin-panel">
            <h2>Nombre de propositions des gagnants</h2>
            {stats.data?.distribution.length ? (
              <div className="admin-distribution">
                {stats.data.distribution.map((item) => (
                  <div key={item.guesses}>
                    <span>{item.guesses} proposition(s)</span>
                    <progress
                      max={Math.max(
                        1,
                        ...stats.data!.distribution.map((entry) => entry.count),
                      )}
                      value={item.count}
                    />
                    <strong>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p className="admin-empty">Aucune victoire sur cette période.</p>
            )}
          </div>
          <div className="admin-panel admin-table-panel">
            <h2>Détail quotidien</h2>
            <div className="admin-table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Jour</th>
                    <th>Sessions</th>
                    <th>Joueurs ayant proposé</th>
                    <th>Gagnées</th>
                    <th>Abandons</th>
                    <th>Propositions</th>
                    <th>Indices utilisés</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day.day}>
                      <th>{date(day.day)}</th>
                      <td>{day.sessions}</td>
                      <td>{day.players}</td>
                      <td>{day.won}</td>
                      <td>{day.abandoned}</td>
                      <td>{day.guesses}</td>
                      <td>{day.reduceHints + day.artHints + day.textHints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!days.length && (
              <p className="admin-empty">Aucune donnée à afficher.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
