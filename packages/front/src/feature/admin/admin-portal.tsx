import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminSession } from '@mtgdle/shared-types';
import { adminRequest } from './admin-api';
import { Notice } from './admin-common';
import { HealthPanel, Statistics } from './admin-dashboard';
import Operations from './admin-operations';
import DatabaseExplorer from './admin-database';
import './admin.css';

type Tab = 'overview' | 'statistics' | 'operations' | 'database';
const tabs: { id: Tab; label: string; mark: string }[] = [
  { id: 'overview', label: 'Vue d’ensemble', mark: '◫' },
  { id: 'statistics', label: 'Statistiques', mark: '▥' },
  { id: 'operations', label: 'Opérations', mark: '↻' },
  { id: 'database', label: 'Base de données', mark: '▤' },
];
export default function AdminPortal() {
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<unknown>(null);
  const [connecting, setConnecting] = useState(false);
  const session = useQuery({
    queryKey: ['admin', 'session'],
    queryFn: () => adminRequest<AdminSession>('auth/session'),
    retry: false,
    refetchInterval: 60000,
  });
  const clearSession = () => {
    void client.cancelQueries({ queryKey: ['admin'] });
    client.removeQueries({
      predicate: (query) =>
        query.queryKey[0] === 'admin' && query.queryKey[1] !== 'session',
    });
    client.setQueryData<AdminSession>(['admin', 'session'], {
      configured: true,
      authenticated: false,
      username: null,
      expiresAt: null,
    });
  };
  useEffect(() => {
    const expire = () => {
      void client.cancelQueries({ queryKey: ['admin'] });
      client.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'admin' && query.queryKey[1] !== 'session',
      });
      client.setQueryData<AdminSession>(['admin', 'session'], {
        configured: true,
        authenticated: false,
        username: null,
        expiresAt: null,
      });
    };
    window.addEventListener('admin-session-expired', expire);
    return () => window.removeEventListener('admin-session-expired', expire);
  }, [client]);
  useEffect(() => {
    document.title = 'Administration · MTGdle';
  }, []);
  useEffect(() => {
    if (session.data?.authenticated === false)
      client.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'admin' && query.queryKey[1] !== 'session',
      });
  }, [client, session.data?.authenticated]);
  async function login(event: React.FormEvent) {
    event.preventDefault();
    setConnecting(true);
    setLoginError(null);
    try {
      const result = await adminRequest<AdminSession>('auth/login', {
        username,
        password,
      });
      client.setQueryData(['admin', 'session'], result);
    } catch (error) {
      setLoginError(error);
    } finally {
      setPassword('');
      setConnecting(false);
    }
  }
  async function logout() {
    try {
      await adminRequest('auth/logout', {});
      clearSession();
    } catch (error) {
      setLoginError(error);
    }
  }
  if (!session.data?.authenticated)
    return (
      <main className="admin-login-page">
        <section className="admin-login-card">
          <a className="admin-brand" href="/">
            MTGdle<span>Administration</span>
          </a>
          <div className="admin-eyebrow">ESPACE PRIVÉ</div>
          <h1>Bienvenue dans les coulisses.</h1>
          <p>
            Gère le catalogue, consulte les parties et explore les données du
            jeu.
          </p>
          {session.isPending ? (
            <p role="status">Vérification de la session…</p>
          ) : (
            <form onSubmit={login}>
              <label>
                Identifiant
                <input
                  name="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  maxLength={40}
                />
              </label>
              <label>
                Mot de passe
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  maxLength={256}
                />
              </label>
              <Notice error={loginError || session.error} />
              {session.data && !session.data.configured && (
                <div className="admin-notice">
                  La connexion n’est pas encore configurée sur le serveur.
                </div>
              )}
              <button
                className="admin-button admin-button-primary"
                disabled={connecting || !session.data?.configured}
              >
                {connecting ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
          )}
          <a className="admin-back" href="/">
            ← Revenir au jeu
          </a>
          <small>
            Connexion réservée à l’administrateur. Session privée de huit
            heures.
          </small>
        </section>
      </main>
    );
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="admin-brand" href="/admin">
          MTGdle<span>Administration</span>
        </a>
        <div className="admin-eyebrow">PILOTAGE DU JEU</div>
        <nav aria-label="Administration">
          {tabs.map((item) => (
            <button
              key={item.id}
              aria-current={tab === item.id ? 'page' : undefined}
              onClick={() => setTab(item.id)}
            >
              <span aria-hidden="true">{item.mark}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <a href="/">↗ Ouvrir le jeu</a>
          <p>
            Connecté : <strong>{session.data.username}</strong>
          </p>
          <button onClick={() => void logout()}>Se déconnecter</button>
        </div>
      </aside>
      <main className="admin-main">
        <header className="admin-page-heading">
          <div>
            <div className="admin-eyebrow">MTGDLE / ADMINISTRATION</div>
            <h1>{tabs.find((item) => item.id === tab)!.label}</h1>
          </div>
          <span className="admin-pill">Accès administrateur</span>
        </header>
        <Notice error={loginError} />
        {tab === 'overview' && (
          <>
            <p className="admin-intro">
              Un regard sur l’activité du jeu et les services qui le font
              tourner.
            </p>
            <HealthPanel />
            <Statistics overview />
            <section className="admin-panel">
              <div className="admin-section-heading">
                <div>
                  <h2>Les bons outils, au même endroit</h2>
                  <p>
                    Préparer le catalogue ou retrouver une donnée en quelques
                    clics.
                  </p>
                </div>
              </div>
              <div className="admin-shortcuts">
                <button onClick={() => setTab('operations')}>
                  <strong>Gérer le catalogue →</strong>
                  <span>
                    Imports Scryfall, cartes jouables et préparation Classic.
                  </span>
                </button>
                <button onClick={() => setTab('database')}>
                  <strong>Explorer la base →</strong>
                  <span>
                    Tables, recherche et détail des lignes, en lecture seule.
                  </span>
                </button>
              </div>
            </section>
          </>
        )}
        {tab === 'statistics' && (
          <>
            <p className="admin-intro">
              Les chiffres du jeu Classic, regroupés par jour à Paris.
            </p>
            <Statistics />
          </>
        )}
        {tab === 'operations' && <Operations />}
        {tab === 'database' && <DatabaseExplorer />}
        <footer className="admin-footer">
          MTGdle · Administration privée · Les données de jeu restent sur ton
          serveur.
        </footer>
      </main>
    </div>
  );
}
