/*
  # Table des tokens Enedis

  1. Nouvelle Table
    - `enedis_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `access_token` (text)
      - `refresh_token` (text)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS enedis_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE enedis_tokens ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own tokens"
  ON enedis_tokens
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Edge Functions can manage tokens"
  ON enedis_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Index
CREATE INDEX enedis_tokens_user_id_idx ON enedis_tokens(user_id);