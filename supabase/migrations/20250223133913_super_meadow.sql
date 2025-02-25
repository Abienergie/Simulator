/*
  # Configuration des commerciaux

  1. Tables
    - `salespeople` : Stockage des informations des commerciaux
      - `id` (uuid, clé primaire)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)

  2. Sécurité
    - Activation RLS
    - Policies pour la lecture et l'écriture
*/

DO $$ BEGIN
  -- Création de la table si elle n'existe pas
  CREATE TABLE IF NOT EXISTS salespeople (
    id uuid PRIMARY KEY REFERENCES auth.users,
    email text UNIQUE NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    last_login timestamptz
  );

  -- Activation RLS
  ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;

  -- Création des policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'salespeople' 
    AND policyname = 'Les commerciaux peuvent lire leurs propres données'
  ) THEN
    CREATE POLICY "Les commerciaux peuvent lire leurs propres données"
      ON salespeople
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'salespeople' 
    AND policyname = 'Les administrateurs peuvent tout gérer'
  ) THEN
    CREATE POLICY "Les administrateurs peuvent tout gérer"
      ON salespeople
      FOR ALL
      TO service_role
      USING (true);
  END IF;

  -- Création des index s'ils n'existent pas
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'salespeople' 
    AND indexname = 'idx_salespeople_email'
  ) THEN
    CREATE INDEX idx_salespeople_email ON salespeople(email);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'salespeople' 
    AND indexname = 'idx_salespeople_active'
  ) THEN
    CREATE INDEX idx_salespeople_active ON salespeople(active);
  END IF;

END $$;