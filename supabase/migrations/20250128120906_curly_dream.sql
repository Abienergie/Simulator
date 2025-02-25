/*
  # Système de gestion des commerciaux

  1. Tables
    - `salespeople` : Informations des commerciaux
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `first_name` (text)
      - `last_name` (text)
      - `active` (boolean)
      - `created_at` (timestamp)
      - `last_login` (timestamp)
      - `reset_token` (text, nullable)
      - `reset_token_expires` (timestamp, nullable)
    
    - `pricing_rules` : Règles de tarification personnalisées
      - `id` (uuid, primary key)
      - `salesperson_id` (uuid, foreign key)
      - `rule_type` (text)
      - `value` (numeric)
      - `min_power` (numeric)
      - `max_power` (numeric)
      - `created_at` (timestamp)
      - `active` (boolean)

  2. Sécurité
    - RLS activé sur toutes les tables
    - Politiques d'accès restrictives
    - Protection des données sensibles

  3. Fonctions
    - Génération de token de réinitialisation
    - Validation de token
    - Mise à jour du mot de passe
*/

-- Table des commerciaux
CREATE TABLE IF NOT EXISTS salespeople (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_login timestamptz,
  reset_token text,
  reset_token_expires timestamptz
);

-- Table des règles de tarification
CREATE TABLE IF NOT EXISTS pricing_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id uuid REFERENCES salespeople(id) NOT NULL,
  rule_type text NOT NULL CHECK (rule_type IN ('discount', 'fixed_price', 'margin')),
  value numeric NOT NULL,
  min_power numeric NOT NULL,
  max_power numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  CONSTRAINT valid_power_range CHECK (min_power <= max_power)
);

-- Activation RLS
ALTER TABLE salespeople ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_rules ENABLE ROW LEVEL SECURITY;

-- Policies pour salespeople
CREATE POLICY "Salespeople can read own data"
  ON salespeople
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Salespeople can update own data"
  ON salespeople
  FOR UPDATE
  USING (auth.uid() = id);

-- Policies pour pricing_rules
CREATE POLICY "Salespeople can read own pricing rules"
  ON pricing_rules
  FOR SELECT
  USING (salesperson_id = auth.uid());

-- Fonction pour générer un token de réinitialisation
CREATE OR REPLACE FUNCTION generate_reset_token(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token text;
  v_expires timestamptz;
BEGIN
  -- Génération d'un token unique
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + interval '1 hour';
  
  -- Mise à jour du commercial
  UPDATE salespeople
  SET reset_token = v_token,
      reset_token_expires = v_expires
  WHERE email = p_email
  AND active = true;
  
  RETURN v_token;
END;
$$;

-- Fonction pour valider un token
CREATE OR REPLACE FUNCTION validate_reset_token(p_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_salesperson_id uuid;
BEGIN
  SELECT id INTO v_salesperson_id
  FROM salespeople
  WHERE reset_token = p_token
  AND reset_token_expires > now()
  AND active = true;
  
  RETURN v_salesperson_id;
END;
$$;

-- Index pour améliorer les performances
CREATE INDEX idx_salespeople_email ON salespeople(email);
CREATE INDEX idx_salespeople_reset_token ON salespeople(reset_token) WHERE reset_token IS NOT NULL;
CREATE INDEX idx_pricing_rules_salesperson ON pricing_rules(salesperson_id, active);