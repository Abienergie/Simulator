/*
  # Création des tables pour les données de consommation Enedis

  1. Nouvelles Tables
    - `consumption_data`
      - `id` (uuid, clé primaire)
      - `prm` (text, identifiant unique du compteur)
      - `date` (timestamptz, date de la mesure)
      - `peak_hours` (numeric, consommation heures pleines)
      - `off_peak_hours` (numeric, consommation heures creuses)
      - `created_at` (timestamptz, date de création)
      - `user_id` (uuid, référence vers auth.users)

  2. Security
    - Enable RLS sur la table consumption_data
    - Policies pour lecture/écriture des données par utilisateur authentifié
*/

-- Création de la table consumption_data
CREATE TABLE IF NOT EXISTS consumption_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prm text NOT NULL,
  date timestamptz NOT NULL,
  peak_hours numeric NOT NULL DEFAULT 0,
  off_peak_hours numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users NOT NULL,
  UNIQUE(prm, date)
);

-- Activation de RLS
ALTER TABLE consumption_data ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own consumption data"
  ON consumption_data
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consumption data"
  ON consumption_data
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Index pour améliorer les performances des requêtes
CREATE INDEX consumption_data_prm_date_idx ON consumption_data(prm, date);
CREATE INDEX consumption_data_user_id_idx ON consumption_data(user_id);