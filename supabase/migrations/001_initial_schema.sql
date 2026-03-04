-- ============================================================
-- ClientPulse — Initial Schema
-- ============================================================

-- 1. clients
CREATE TABLE clients (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text,
  preferred_contact text DEFAULT 'email',
  client_type     text NOT NULL,
  status          text DEFAULT 'active',
  lifecycle_stage text DEFAULT 'new_lead',
  source          text,
  assigned_agent  text,
  notes           text,
  avatar_url      text,
  created_at      timestamptz DEFAULT now(),
  last_contact    timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- 2. client_preferences
CREATE TABLE client_preferences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  rental      jsonb,
  buyer       jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 3. activities
CREATE TABLE activities (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type              text NOT NULL,
  title             text NOT NULL,
  description       text,
  property_address  text,
  timestamp         timestamptz DEFAULT now(),
  agent_name        text,
  created_at        timestamptz DEFAULT now()
);

-- 4. transactions
CREATE TABLE transactions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id         uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id       text,
  property_address  text,
  type              text NOT NULL,
  date              timestamptz,
  amount            numeric,
  lease_end_date    timestamptz,
  notes             text,
  created_at        timestamptz DEFAULT now()
);

-- 5. property_matches
CREATE TABLE property_matches (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name     text,
  listing_id      text,
  address         text,
  city            text,
  price           numeric,
  bedrooms        int,
  bathrooms       numeric,
  sqft            int,
  property_type   text,
  match_score     int,
  match_reasons   text[],
  status          text DEFAULT 'new',
  found_at        timestamptz DEFAULT now(),
  mls_number      text,
  photo_url       text,
  created_at      timestamptz DEFAULT now()
);

-- 6. ai_profiles
CREATE TABLE ai_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id     uuid NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  summary       text,
  next_actions  jsonb,
  updated_at    timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now()
);

-- 7. triggers
CREATE TABLE triggers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name     text,
  type            text NOT NULL,
  title           text NOT NULL,
  description     text,
  fire_date       timestamptz,
  status          text DEFAULT 'pending',
  message_draft   text,
  urgency         text DEFAULT 'medium',
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_activities_client_id    ON activities(client_id);
CREATE INDEX idx_activities_timestamp    ON activities(timestamp DESC);
CREATE INDEX idx_transactions_client_id  ON transactions(client_id);
CREATE INDEX idx_property_matches_client_id ON property_matches(client_id);
CREATE INDEX idx_triggers_client_id      ON triggers(client_id);
CREATE INDEX idx_triggers_fire_date      ON triggers(fire_date);
CREATE INDEX idx_triggers_status         ON triggers(status);
CREATE INDEX idx_clients_status          ON clients(status);
CREATE INDEX idx_clients_lifecycle_stage ON clients(lifecycle_stage);

-- ============================================================
-- Auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_client_preferences_updated_at
  BEFORE UPDATE ON client_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_triggers_updated_at
  BEFORE UPDATE ON triggers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE clients             ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_matches    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE triggers            ENABLE ROW LEVEL SECURITY;

-- Service role bypass (server-side operations)
CREATE POLICY "Service role full access" ON clients
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON client_preferences
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON activities
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON transactions
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON property_matches
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON ai_profiles
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access" ON triggers
  FOR ALL USING (true) WITH CHECK (true);

-- Anon key read-only (client-side reads)
CREATE POLICY "Anon read access" ON clients
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON client_preferences
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON activities
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON transactions
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON property_matches
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON ai_profiles
  FOR SELECT USING (true);
CREATE POLICY "Anon read access" ON triggers
  FOR SELECT USING (true);
