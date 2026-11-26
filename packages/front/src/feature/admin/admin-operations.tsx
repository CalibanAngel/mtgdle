import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminJob, AdminOperation } from '@mtgdle/shared-types';
import { adminRequest } from './admin-api';
import { Notice, Dialog, moment } from './admin-common';

const operations: {
  id: AdminOperation;
  title: string;
  description: string;
  action: string;
  category: 'catalogue' | 'import';
  input?: 'cardId' | 'names';
}[] = [
  {
    id: 'catalogue:check',
    title: 'Vérifier le catalogue',
    description:
      'Simule la préparation à partir du snapshot et des cartes sélectionnées, sans écrire en base.',
    action: 'Vérifier',
    category: 'catalogue',
  },
  {
    id: 'catalogue:prepare',
    title: 'Préparer le catalogue',
    description:
      'Reconstruit le catalogue Classic et enrichit les médias des défis en conservant leurs réponses.',
    action: 'Préparer',
    category: 'catalogue',
  },
  {
    id: 'playable:automatic',
    title: 'Sélection automatique',
    description:
      'Ajoute les cartes jouables selon le seuil de popularité existant. Préparer ensuite le catalogue Classic.',
    action: 'Sélectionner',
    category: 'catalogue',
  },
  {
    id: 'playable:manual',
    title: 'Ajouter des cartes jouables',
    description:
      'Un nom anglais par ligne. Les cartes doivent déjà exister dans la base. Préparer ensuite le catalogue.',
    action: 'Ajouter',
    category: 'catalogue',
    input: 'names',
  },
  {
    id: 'scryfall:download',
    title: 'Télécharger le snapshot',
    description:
      'Télécharge la source Scryfall sur le serveur. Cette étape peut prendre plusieurs minutes et remplace le snapshot après succès.',
    action: 'Télécharger',
    category: 'import',
  },
  {
    id: 'scryfall:import',
    title: 'Importer le snapshot complet',
    description:
      'Importe les éditions, les cartes du snapshot local puis la sélection jouable. Préparer le catalogue à la fin.',
    action: 'Importer',
    category: 'import',
  },
  {
    id: 'sets:import',
    title: 'Importer les éditions',
    description: 'Actualise les éditions prises en charge depuis Scryfall.',
    action: 'Importer les éditions',
    category: 'import',
  },
  {
    id: 'cards:import',
    title: 'Importer les cartes locales',
    description:
      'Importe les cartes à partir du snapshot présent sur le serveur.',
    action: 'Importer les cartes',
    category: 'import',
  },
  {
    id: 'card:import',
    title: 'Importer une carte Scryfall',
    description:
      'Ajoute une carte à partir de son identifiant Scryfall, au format UUID.',
    action: 'Importer cette carte',
    category: 'import',
    input: 'cardId',
  },
];

export default function Operations() {
  const [pending, setPending] = useState<(typeof operations)[number] | null>(
    null,
  );
  const [names, setNames] = useState('');
  const [cardId, setCardId] = useState('');
  const [error, setError] = useState<unknown>(null);
  const [starting, setStarting] = useState(false);
  const client = useQueryClient();
  const jobs = useQuery({
    queryKey: ['admin', 'jobs'],
    queryFn: () => adminRequest<AdminJob[]>('jobs'),
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.some((job) => job.status === 'running') ? 2000 : 10000,
  });
  useEffect(() => {
    if (jobs.data?.[0]?.status === 'succeeded') {
      for (const key of ['tables', 'rows', 'row', 'statistics'])
        void client.invalidateQueries({ queryKey: ['admin', key] });
    }
  }, [client, jobs.data?.[0]?.id, jobs.data?.[0]?.status]);
  const busy = starting || jobs.data?.some((job) => job.status === 'running');
  async function start(operation: (typeof operations)[number]) {
    setStarting(true);
    setError(null);
    try {
      await adminRequest<AdminJob>('jobs', {
        operation: operation.id,
        ...(operation.input === 'names'
          ? {
              names: names
                .split('\n')
                .map((name) => name.trim())
                .filter(Boolean),
            }
          : {}),
        ...(operation.input === 'cardId' ? { cardId: cardId.trim() } : {}),
      });
      setPending(null);
      await client.invalidateQueries({ queryKey: ['admin', 'jobs'] });
    } catch (problem) {
      setError(problem);
    } finally {
      setStarting(false);
    }
  }
  return (
    <>
      <p className="admin-intro">
        Prépare le catalogue et actualise les données du jeu, avec un suivi de
        chaque traitement.
      </p>
      <div className="admin-notice">
        Un seul traitement à la fois. L’historique contient les 20 dernières
        tâches. Un redémarrage de l’application interrompt le traitement et
        efface cet historique.
      </div>
      <Notice error={error || jobs.error} />
      {(['catalogue', 'import'] as const).map((category) => (
        <section key={category}>
          <div className="admin-section-heading">
            <div>
              <h2>
                {category === 'catalogue'
                  ? 'Catalogue & cartes jouables'
                  : 'Sources & imports Scryfall'}
              </h2>
              <p>
                {category === 'catalogue'
                  ? 'La sélection jouable alimente ensuite le catalogue Classic.'
                  : 'Ordre conseillé : télécharger → importer → préparer le catalogue.'}
              </p>
            </div>
          </div>
          <div className="admin-operation-grid">
            {operations
              .filter((operation) => operation.category === category)
              .map((operation) => (
                <article
                  className="admin-panel admin-operation"
                  key={operation.id}
                >
                  <h3>{operation.title}</h3>
                  <p>{operation.description}</p>
                  {operation.input === 'names' && (
                    <label>
                      Noms des cartes
                      <textarea
                        rows={4}
                        value={names}
                        onChange={(event) => setNames(event.target.value)}
                        placeholder={'Path to Exile\nSol Ring'}
                        maxLength={20100}
                      />
                    </label>
                  )}
                  {operation.input === 'cardId' && (
                    <label>
                      Identifiant Scryfall
                      <input
                        value={cardId}
                        onChange={(event) => setCardId(event.target.value)}
                        placeholder="00000000-0000-4000-8000-000000000000"
                        maxLength={36}
                      />
                    </label>
                  )}
                  <button
                    className="admin-button"
                    disabled={
                      busy ||
                      (operation.input === 'names' && !names.trim()) ||
                      (operation.input === 'cardId' && !cardId.trim())
                    }
                    onClick={() =>
                      operation.id === 'catalogue:check'
                        ? void start(operation)
                        : setPending(operation)
                    }
                  >
                    {operation.action}
                  </button>
                </article>
              ))}
          </div>
        </section>
      ))}
      <section className="admin-panel">
        <div className="admin-section-heading">
          <div>
            <h2>Suivi des traitements</h2>
            <p>Les opérations continuent si tu changes de page.</p>
          </div>
          <button className="admin-button" onClick={() => void jobs.refetch()}>
            Actualiser
          </button>
        </div>
        {!jobs.data?.length && (
          <p className="admin-empty">
            Aucun traitement lancé depuis le dernier démarrage de l’API.
          </p>
        )}
        <div className="admin-job-list">
          {jobs.data?.map((job) => (
            <article key={job.id}>
              <div>
                <strong>
                  {operations.find(
                    (operation) => operation.id === job.operation,
                  )?.title || job.operation}
                </strong>
                <small>
                  {moment(job.startedAt)}
                  {job.finishedAt ? ` → ${moment(job.finishedAt)}` : ''}
                </small>
              </div>
              <span className={`admin-job-status is-${job.status}`}>
                {job.status === 'running'
                  ? 'En cours'
                  : job.status === 'succeeded'
                    ? 'Terminé'
                    : 'Échec'}
              </span>
              {(job.result || job.error) && <p>{job.result || job.error}</p>}
            </article>
          ))}
        </div>
      </section>
      {pending && (
        <Dialog
          title="Confirmer le traitement"
          close={() => !starting && setPending(null)}
        >
          <p>
            <strong>{pending.title}</strong>
          </p>
          <p>{pending.description}</p>
          <p>
            Cette opération agit sur les données du serveur. Aucun autre
            traitement ne pourra être lancé depuis le portail tant qu’elle est
            en cours.
          </p>
          <div className="admin-dialog-actions">
            <button
              className="admin-button"
              autoFocus
              disabled={starting}
              onClick={() => setPending(null)}
            >
              Annuler
            </button>
            <button
              className="admin-button admin-button-primary"
              disabled={starting}
              onClick={() => void start(pending)}
            >
              {starting ? 'Démarrage…' : 'Confirmer'}
            </button>
          </div>
          <Notice error={error} />
        </Dialog>
      )}
    </>
  );
}
