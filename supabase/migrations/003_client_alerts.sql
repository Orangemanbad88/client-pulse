-- alerts_enabled on clients (default true)
ALTER TABLE clients ADD COLUMN alerts_enabled BOOLEAN DEFAULT true;

-- client_alerts table
CREATE TABLE client_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  property_type TEXT NOT NULL CHECK (property_type IN ('listing', 'rental')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_alerts_status ON client_alerts(status);
CREATE INDEX idx_client_alerts_client ON client_alerts(client_id);
CREATE UNIQUE INDEX idx_client_alerts_dedup ON client_alerts(client_id, property_id);

-- RLS
ALTER TABLE client_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON client_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON client_alerts FOR SELECT TO anon USING (true);

-- app_settings (for global auto-alerts toggle)
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "anon_read" ON app_settings FOR SELECT TO anon USING (true);

INSERT INTO app_settings (key, value) VALUES ('autoAlertsEnabled', 'true');
