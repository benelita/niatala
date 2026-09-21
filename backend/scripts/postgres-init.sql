-- PostgreSQL Initialization Script for NIATALA
-- This script runs automatically when PostgreSQL container starts

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas if needed
CREATE SCHEMA IF NOT EXISTS public;

-- Initial setup complete
-- Prisma migrations will handle table creation
