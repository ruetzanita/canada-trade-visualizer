-- Migration: 0001_add_qualitative_and_digest_tables.sql
-- Description: Adds country_context for autonomous qualitative country card updates
-- and weekly_digests for the UI Expert Digest Card and backend research archive.

CREATE TABLE IF NOT EXISTS country_context (
  country_name TEXT PRIMARY KEY,
  country_code TEXT NOT NULL,
  region TEXT NOT NULL,
  historical_background TEXT NOT NULL,
  top_5_commodities TEXT NOT NULL,     -- JSON array string e.g. '["Machinery", "Vehicles"]'
  trade_stance TEXT NOT NULL,
  deals_and_disruptions TEXT NOT NULL, -- JSON key-value string e.g. '{"2024": "...", "2025": "...", "2026": "..."}'
  source_link TEXT NOT NULL,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_country_context_region ON country_context(region);
CREATE INDEX IF NOT EXISTS idx_country_context_code ON country_context(country_code);

CREATE TABLE IF NOT EXISTS weekly_digests (
  id TEXT PRIMARY KEY,                 -- e.g. '2026-W39'
  edition_date DATE NOT NULL,          -- e.g. '2026-09-27'
  headline TEXT NOT NULL,
  summary TEXT NOT NULL,               -- Editorial summary (min 3 paragraphs to 2 pages)
  key_developments TEXT NOT NULL,      -- JSON array string: [{ title, description, source_name, source_url, tag }]
  countries_affected TEXT NOT NULL,    -- JSON array string: ["Germany", "Indonesia", "South Korea"]
  primary_sources TEXT NOT NULL,       -- JSON array string: [{ title, url }]
  full_research_publication TEXT,      -- Backend-only archive of Tier 1 deep research
  economist_notes TEXT,                -- Backend-only notes & early warning signals
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weekly_digests_date ON weekly_digests(edition_date DESC);
