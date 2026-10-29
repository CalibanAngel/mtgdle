-- Additive, idempotent migration. Existing card/game tables are untouched.
CREATE TABLE IF NOT EXISTS classic_catalogue (
  id uuid PRIMARY KEY,
  data jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS classic_daily (
  day text PRIMARY KEY CHECK (day ~ '^\d{4}-\d{2}-\d{2}$'),
  answer_id uuid NOT NULL,
  cards jsonb NOT NULL,
  rules_version integer NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS classic_progress (
  day text NOT NULL REFERENCES classic_daily(day),
  session_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'playing' CHECK (status IN ('playing','won','abandoned')),
  guesses jsonb NOT NULL DEFAULT '[]',
  removed jsonb NOT NULL DEFAULT '[]',
  hint_used boolean NOT NULL DEFAULT false,
  PRIMARY KEY (day, session_id)
);
