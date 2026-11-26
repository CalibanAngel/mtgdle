import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { AdminRows, AdminTable } from '@mtgdle/shared-types';
import { adminRequest } from './admin-api';
import { Notice, Dialog, cell, number } from './admin-common';

export default function DatabaseExplorer() {
  const [table, setTable] = useState('classic_catalogue');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('');
  const [order, setOrder] = useState('ASC');
  const [key, setKey] = useState<string | null>(null);
  const tables = useQuery({
    queryKey: ['admin', 'tables'],
    queryFn: () => adminRequest<AdminTable[]>('database'),
    retry: false,
  });
  const selected = tables.data?.find((item) => item.name === table);
  const query = new URLSearchParams({
    page: String(page),
    pageSize: '20',
    q,
    order,
    ...(sort ? { sort } : {}),
  });
  const rows = useQuery({
    queryKey: ['admin', 'rows', table, page, q, sort, order],
    queryFn: () =>
      adminRequest<AdminRows>(
        `database/${encodeURIComponent(table)}/rows?${query}`,
      ),
    enabled: Boolean(selected),
    retry: false,
  });
  const detail = useQuery({
    queryKey: ['admin', 'row', table, key],
    queryFn: () =>
      adminRequest<{ data: Record<string, unknown> }>(
        `database/${encodeURIComponent(table)}/row?key=${encodeURIComponent(key!)}`,
      ),
    enabled: Boolean(key),
    retry: false,
  });
  const columns = rows.data?.columns || selected?.columns || [];
  const pages = Math.max(1, Math.ceil((rows.data?.total || 0) / 20));
  function selectTable(name: string) {
    setTable(name);
    setPage(1);
    setSearch('');
    setQ('');
    setSort('');
    setOrder('ASC');
    setKey(null);
  }
  return (
    <>
      <p className="admin-intro">
        Parcours les données de l’application. Aucune modification ni requête
        SQL libre n’est possible ici.
      </p>
      <div className="admin-database">
        <label className="admin-table-picker">
          Table
          <select
            aria-label="Table"
            value={table}
            onChange={(event) => selectTable(event.target.value)}
          >
            {tables.data?.map((item) => (
              <option key={item.name} value={item.name}>
                {item.label} · {number.format(item.count)} lignes
              </option>
            ))}
          </select>
        </label>
        <aside className="admin-table-list" aria-label="Tables de la base">
          <div className="admin-eyebrow">TABLES AUTORISÉES</div>
          {tables.isPending && <p>Chargement…</p>}
          {tables.data?.map((item) => (
            <button
              key={item.name}
              aria-current={table === item.name ? 'true' : undefined}
              onClick={() => selectTable(item.name)}
            >
              <span>
                <strong>{item.label}</strong>
                <small>{item.name}</small>
              </span>
              <b>{number.format(item.count)}</b>
            </button>
          ))}
        </aside>
        <section className="admin-panel admin-table-panel">
          <div className="admin-section-heading">
            <div>
              <h2>{selected?.label || 'Explorateur'}</h2>
              <p>
                {selected?.name} ·{' '}
                {number.format(rows.data?.total ?? selected?.count ?? 0)}{' '}
                ligne(s)
              </p>
            </div>
            <button
              className="admin-button"
              disabled={rows.isFetching || tables.isFetching}
              onClick={() => {
                void rows.refetch();
                void tables.refetch();
              }}
            >
              Actualiser les données
            </button>
          </div>
          <Notice error={tables.error || rows.error} />
          <form
            className="admin-explorer-controls"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setQ(search);
            }}
          >
            <label>
              Recherche
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Texte ou identifiant…"
                maxLength={80}
              />
            </label>
            <button className="admin-button" disabled={rows.isFetching}>
              Rechercher
            </button>
            <label>
              Trier par
              <select
                value={
                  sort || columns.find((column) => column.primary)?.name || ''
                }
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
              >
                {columns
                  .filter(
                    (column) =>
                      !['json', 'jsonb'].includes(column.type) &&
                      !column.type.endsWith('[]'),
                  )
                  .map((column) => (
                    <option key={column.name} value={column.name}>
                      {column.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Ordre
              <select
                value={order}
                onChange={(event) => {
                  setOrder(event.target.value);
                  setPage(1);
                }}
              >
                <option value="ASC">Croissant</option>
                <option value="DESC">Décroissant</option>
              </select>
            </label>
          </form>
          <div className="admin-table-scroll" aria-busy={rows.isFetching}>
            <table>
              <thead>
                <tr>
                  <th>Détail</th>
                  {columns.map((column) => (
                    <th
                      key={column.name}
                      title={`${column.type}${column.primary ? ' · clé primaire' : ''}`}
                    >
                      {column.name}
                      {column.primary ? ' ⌑' : ''}
                      <small>{column.type}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.data?.rows.map((row, index) => (
                  <tr
                    key={
                      JSON.stringify(
                        columns
                          .filter((column) => column.primary)
                          .map((column) => row[column.name]),
                      ) || index
                    }
                  >
                    <td>
                      <button
                        className="admin-row-open"
                        aria-label={`Ouvrir la ligne ${index + 1}`}
                        onClick={() =>
                          setKey(
                            JSON.stringify(
                              Object.fromEntries(
                                columns
                                  .filter((column) => column.primary)
                                  .map((column) => [
                                    column.name,
                                    row[column.name],
                                  ]),
                              ),
                            ),
                          )
                        }
                      >
                        Ouvrir ↗
                      </button>
                    </td>
                    {columns.map((column) => (
                      <td
                        key={column.name}
                        className="admin-data-cell"
                        title={cell(row[column.name])}
                      >
                        {cell(row[column.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.isPending && (
            <p className="admin-empty" role="status">
              Chargement des lignes…
            </p>
          )}
          {rows.data && !rows.data.rows.length && (
            <p className="admin-empty">
              Aucune ligne ne correspond à cette recherche.
            </p>
          )}
          <div className="admin-pagination">
            <span>
              Page {page} sur {pages} · 20 lignes par page
            </span>
            <button
              className="admin-button"
              disabled={page <= 1 || rows.isFetching}
              onClick={() => setPage((value) => value - 1)}
            >
              Précédent
            </button>
            <button
              className="admin-button"
              disabled={page >= pages || rows.isFetching}
              onClick={() => setPage((value) => value + 1)}
            >
              Suivant
            </button>
          </div>
        </section>
      </div>
      {key && (
        <Dialog
          title={`Détail · ${selected?.label || table}`}
          close={() => setKey(null)}
        >
          <span className="admin-pill">Lecture seule</span>
          <Notice error={detail.error} />
          {detail.isPending ? (
            <p>Chargement du détail…</p>
          ) : (
            <pre className="admin-json">
              {JSON.stringify(detail.data?.data, null, 2)}
            </pre>
          )}
        </Dialog>
      )}
    </>
  );
}
