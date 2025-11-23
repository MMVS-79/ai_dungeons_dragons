/**
 * Database Connection Handler
 * ---------------------------
 * Creates and exports a reusable database client for MySQL/PostgreSQL.
 * 
 * Responsibilities:
 * - query(): execute SQL statements from schema/tables/
 * - connect(): establish DB connection
 * - close(): clean up connection
 * 
 * Used by:
 * - gameEngine.service.ts → read/write player and campaign data
 * - llm.service.ts → store LLM event logs
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

