ALTER TABLE client_preferences
  ADD CONSTRAINT client_preferences_client_id_key UNIQUE (client_id);
