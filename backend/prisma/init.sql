-- CertiChain Database Initialization
-- This file is mounted to docker-entrypoint-initdb.d for auto-execution

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (handled by POSTGRES_DB env var)
-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE certichain TO certichain;
