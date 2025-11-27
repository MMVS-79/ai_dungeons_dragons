/**
 * Database Connection Handler
 * ---------------------------
 * MySQL connection pool for the application.
 * 
 * Configuration loaded from .env.local:
 * - DB_HOST
 * - DB_USER
 * - DB_PASS
 * - DB_NAME
 * 
 * Exported as 'pool' for use throughout the application.
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
