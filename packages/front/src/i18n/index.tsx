import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

const fr = {
  classic: 'Classique',
  gameType: 'Jeu — Devinette',
  attempts: '{count} essais',
  attemptCount: 'Nombre d’essais',
  languageSwitch: 'Passer en anglais',
  darkMode: 'Activer le mode sombre',
  lightMode: 'Activer le mode clair',
  loading: 'Chargement…',
  loadError: 'Impossible de charger le défi.',
  retry: 'Réessayer',
  hints: 'Indices',
  reduce: 'Réduire les choix',
  art: 'Illustration',
  text: 'Texte de règles',
  hintLabel: 'Indice {number} : {label}',
  hintUsed: 'Indice déjà révélé',
  hintThreshold: 'Disponible après {count} erreurs',
  errors: '{count} erreurs',
  removed: '{count} cartes retirées',
  revealed: 'Révélé',
  enlargeArt: 'Agrandir l’illustration',
  artOfDay: 'Illustration du jour',
  artAlt: 'Illustration de la carte du jour',
  reloadArt: 'Recharger l’illustration',
  cardName: 'Nom de la carte (anglais)',
  enlarge: 'Agrandir {name}',
  search: 'Chercher une carte…',
  possibleCards: 'Cartes possibles',
  submit: 'Proposer',
  noCards: 'Aucune carte disponible.',
  won: 'BIEN JOUÉ !',
  answer: 'LA CARTE DU JOUR',
  copied: 'Copié ✓',
  share: 'Partager mon résultat',
  history: 'Historique des essais',
  legend: 'Exact · Partiel · Plus / moins',
  noGuesses: 'Aucune proposition.',
  comparison: 'Comparaisons avec la carte du jour',
  card: 'Carte',
  identity: 'Identité',
  mana: 'Mana',
  types: 'Types',
  edition: 'Première édition',
  period: 'Période',
  keywords: 'Mots-clés',
  activated: 'Capacité activée',
  rarity: 'Rareté',
  rarityCommon: 'Commune',
  rarityUncommon: 'Peu commune',
  rarityRare: 'Rare',
  rarityMythic: 'Mythique',
  raritySpecial: 'Spéciale',
  rarityBonus: 'Bonus',
  rarityUnknown: 'Inconnue',
  exact: 'Correspondance exacte',
  partial: 'Correspondance partielle',
  different: 'Différent',
  higher: 'La cible a une valeur supérieure',
  lower: 'La cible a une valeur inférieure',
  white: 'Blanc',
  blue: 'Bleu',
  black: 'Noir',
  red: 'Rouge',
  green: 'Vert',
  colorless: 'Incolore',
  yes: 'Oui',
  no: 'Non',
  none: 'Aucun',
  rules: 'Règles',
  rulesBody:
    'Essais illimités. Compare l’identité couleur, le mana, les types, la première édition, la période de deux ans, les mots-clés, les capacités activées et la rareté. ✓ Exact · ≈ Partiel · ↑ / ↓ Plus / moins.',
  rulesHints:
    'Indices facultatifs à 10, 15 et 20 erreurs. Progression sauvegardée par un cookie anonyme. Nouveau défi à minuit, heure de Paris.',
  confirmAbandon: 'Confirmer l’abandon',
  cancel: 'Annuler',
  abandon: 'Abandonner et révéler la carte',
  preview: 'Aperçu : {name}',
  previewCard: 'Aperçu de carte',
  closePreview: 'Fermer l’aperçu',
  cardReference: '[cette carte]',
  noRulesText: 'Aucun texte de règles.',
  shareResult: '{count} essai(s) · {result}{hint}',
  shareWon: 'Trouvé !',
  shareAbandoned: 'Abandon',
  withHint: ' · avec indice',
  errorNetwork: 'Le serveur est indisponible. Réessaie dans un instant.',
  errorClipboard: 'Le partage nécessite l’accès au presse-papiers.',
  errorExpired: 'Ce défi est terminé. Charge le nouveau défi.',
  errorFinished: 'Cette partie est déjà terminée.',
  errorDuplicate: 'Cette carte ne peut plus être choisie.',
  errorRequest: 'Cette requête correspond à une autre carte.',
  errorCard: 'Cette carte ne fait pas partie du défi.',
  errorHint: 'Cet indice n’est pas encore disponible.',
  errorArt: 'Illustration indisponible.',
  errorText: 'Texte de règles indisponible.',
  errorChoices: 'Il ne reste pas assez de cartes à retirer.',
  errorCatalogue: 'Le catalogue de jeu doit être préparé.',
  errorChallenge: 'Défi introuvable.',
  errorGeneral: 'Une erreur est survenue.',
  refresh: 'Actualiser',
  notFound: '404 - Page introuvable',
  notFoundBody: 'Cette page n’existe pas.',
  home: 'Retour au jeu',
  sets: 'Éditions',
  health: 'État des services',
  name: 'Nom',
  code: 'Code',
  setType: 'Type',
  releaseDate: 'Date de sortie',
  icon: 'Icône',
  cards: 'Cartes',
  noRows: 'Aucune donnée.',
  healthApi: 'État de l’API',
  overall: 'Ensemble',
  database: 'Base de données',
  latency: 'Latence',
  up: 'Disponible',
  down: 'Indisponible',
  statusError: 'Erreur',
} as const;
const en: Record<keyof typeof fr, string> = {
  classic: 'Classic',
  gameType: 'Game — Guess',
  attempts: '{count} guesses',
  attemptCount: 'Guess count',
  languageSwitch: 'Switch to French',
  darkMode: 'Switch to dark mode',
  lightMode: 'Switch to light mode',
  loading: 'Loading…',
  loadError: 'Unable to load the daily challenge.',
  retry: 'Try again',
  hints: 'Hints',
  reduce: 'Narrow the choices',
  art: 'Artwork',
  text: 'Rules text',
  hintLabel: 'Hint {number}: {label}',
  hintUsed: 'Hint already revealed',
  hintThreshold: 'Available after {count} wrong guesses',
  errors: '{count} wrong guesses',
  removed: '{count} cards removed',
  revealed: 'Revealed',
  enlargeArt: 'Enlarge the artwork',
  artOfDay: 'Today’s artwork',
  artAlt: 'Artwork of today’s card',
  reloadArt: 'Reload artwork',
  cardName: 'Card name (English)',
  enlarge: 'Enlarge {name}',
  search: 'Search for a card…',
  possibleCards: 'Available cards',
  submit: 'Guess',
  noCards: 'No matching cards available.',
  won: 'WELL PLAYED!',
  answer: 'TODAY’S CARD',
  copied: 'Copied ✓',
  share: 'Share my result',
  history: 'Guess history',
  legend: 'Exact · Partial · Higher / lower',
  noGuesses: 'No guesses yet.',
  comparison: 'Comparisons with today’s card',
  card: 'Card',
  identity: 'Color identity',
  mana: 'Mana',
  types: 'Types',
  edition: 'First set',
  period: 'Period',
  keywords: 'Keywords',
  activated: 'Activated ability',
  rarity: 'Rarity',
  rarityCommon: 'Common',
  rarityUncommon: 'Uncommon',
  rarityRare: 'Rare',
  rarityMythic: 'Mythic',
  raritySpecial: 'Special',
  rarityBonus: 'Bonus',
  rarityUnknown: 'Unknown',
  exact: 'Exact match',
  partial: 'Partial match',
  different: 'Different',
  higher: 'The target has a higher value',
  lower: 'The target has a lower value',
  white: 'White',
  blue: 'Blue',
  black: 'Black',
  red: 'Red',
  green: 'Green',
  colorless: 'Colorless',
  yes: 'Yes',
  no: 'No',
  none: 'None',
  rules: 'Rules',
  rulesBody:
    'Unlimited guesses. Compare color identity, mana value, types, first set, two-year release period, keywords, activated abilities and rarity. ✓ Exact · ≈ Partial · ↑ / ↓ Higher / lower.',
  rulesHints:
    'Optional hints after 10, 15 and 20 wrong guesses. Progress is saved with an anonymous cookie. A new challenge starts at midnight, Paris time.',
  confirmAbandon: 'Confirm giving up',
  cancel: 'Cancel',
  abandon: 'Give up and reveal the card',
  preview: 'Preview: {name}',
  previewCard: 'Card preview',
  closePreview: 'Close preview',
  cardReference: '[this card]',
  noRulesText: 'No rules text.',
  shareResult: '{count} guess(es) · {result}{hint}',
  shareWon: 'Solved!',
  shareAbandoned: 'Gave up',
  withHint: ' · with hints',
  errorNetwork: 'The server is unavailable. Please try again shortly.',
  errorClipboard: 'Sharing requires clipboard access.',
  errorExpired: 'This challenge has ended. Load today’s challenge.',
  errorFinished: 'This game has already ended.',
  errorDuplicate: 'This card is no longer available.',
  errorRequest: 'This request belongs to a different card.',
  errorCard: 'This card is not part of the challenge.',
  errorHint: 'This hint is not available yet.',
  errorArt: 'Artwork unavailable.',
  errorText: 'Rules text unavailable.',
  errorChoices: 'There are not enough cards left to remove.',
  errorCatalogue: 'The game catalogue needs to be prepared.',
  errorChallenge: 'Challenge not found.',
  errorGeneral: 'Something went wrong.',
  refresh: 'Refresh',
  notFound: '404 - Not Found',
  notFoundBody: 'This page does not exist.',
  home: 'Go to Home',
  sets: 'Sets',
  health: 'Service status',
  name: 'Name',
  code: 'Code',
  setType: 'Type',
  releaseDate: 'Release date',
  icon: 'Icon',
  cards: 'Cards',
  noRows: 'No data available.',
  healthApi: 'API status',
  overall: 'Overall',
  database: 'Database',
  latency: 'Latency',
  up: 'Up',
  down: 'Down',
  statusError: 'Error',
};

export type Locale = 'fr' | 'en';
export type TranslationKey = keyof typeof fr;
export function translate(
  locale: Locale,
  key: TranslationKey,
  params: Record<string, string | number> = {},
): string {
  return (locale === 'en' ? en[key] : fr[key]).replace(
    /\{(\w+)\}/g,
    (_, name: string) => String(params[name] ?? `{${name}}`),
  );
}
export function isTranslationKey(key: string): key is TranslationKey {
  return Object.hasOwn(fr, key);
}
const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
}>({ locale: 'fr', setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    try {
      return localStorage.getItem('mtgdle.language') === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  });

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem('mtgdle.language', locale);
    } catch {
      /* Storage is optional. */
    }
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}
export function useI18n() {
  const { locale, setLocale } = useContext(LocaleContext);

  return {
    locale,
    setLocale,
    t: (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(locale, key, params),
  };
}
export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();

  return (
    <button
      aria-label={t('languageSwitch')}
      className="classic-mana-control"
      title={t('languageSwitch')}
      type="button"
      onClick={() => setLocale(locale === 'fr' ? 'en' : 'fr')}
    >
      {locale === 'fr' ? 'EN' : 'FR'}
    </button>
  );
}
