-- Email accounts for OAuth-connected Gmail/Outlook sending
CREATE TABLE email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL CHECK (provider IN ('gmail', 'outlook')),
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_primary BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- One account per provider max (single-agent app)
CREATE UNIQUE INDEX idx_email_accounts_provider ON email_accounts(provider);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_email_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_email_accounts_updated_at
  BEFORE UPDATE ON email_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_email_accounts_updated_at();

-- RLS
ALTER TABLE email_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_full" ON email_accounts FOR ALL TO service_role USING (true) WITH CHECK (true);
