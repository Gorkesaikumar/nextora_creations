CREATE TABLE nc.company_assets (
  name text PRIMARY KEY CHECK (name = 'authorized_signature'),
  png bytea NOT NULL CHECK (octet_length(png) BETWEEN 24 AND 512000),
  sha256 text NOT NULL,
  updated_by uuid NOT NULL REFERENCES nc.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
