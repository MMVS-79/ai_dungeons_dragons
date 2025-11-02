# Library (`lib/`) Overview

This folder contains all backend logic and automation scripts that support the D&D web application.  
It includes database management tools, AI integration services, type definitions, and utility functions.

Each section below describes the purpose of the folders and files in this directory.

---

## Folder Overview

| Folder / File | Purpose |
|----------------|----------|
| **crons/** | Contains automated tasks (cron jobs) that run at scheduled times on the server, such as cleaning logs or rebuilding the database. |
| **schema/tables/** | Holds individual SQL files that define the structure (tables, columns, and relationships) of the project’s MySQL database. |
| **services/** | Contains service modules used by the app — for example, the integration with Google’s Gemini AI for generating D&D events. |
| **types/** | Stores TypeScript type definitions that describe data structures and API contracts between parts of the system. |
| **utils/** | Includes small utility scripts for managing configuration, environment variables, and helper logic shared by other modules. |
| **db.ts** | Handles the connection setup to the MySQL database using environment variables. |
| **rebuild.sh** | A shell script that automatically rebuilds the database schema whenever changes are detected. Used on the server. |
| **rebuild.sql** | The SQL script that runs all table creation scripts in the correct order — the “master setup” for the database. |
| **seed.sql** | Fills the database with sample (test) data like default accounts, enemies, items, and characters. |

---

##  Details by Folder

###  `crons/` – Automated Scheduled Tasks

Cron jobs are scripts that run automatically on the server based on a time schedule.  
They handle background maintenance work so developers don’t have to do it manually.

| File | Description |
|-------|-------------|
| **logprune** | Deletes or empties `.log` files daily to prevent them from growing too large.<br>**Schedule:** Runs once per day at midnight. |
| **ai_dnd_db_rebuild** | Rebuilds the database automatically at regular intervals (every minute by default).<br>**Purpose:** Ensures the database schema stays up-to-date with recent code changes. |

---

###  `schema/tables/` – Database Table Definitions

Each `.sql` file defines one table in the MySQL database.  
These are combined by `rebuild.sql` to create or update the full database structure.

| Example File | Purpose |
|---------------|----------|
| **accounts.sql** | Defines user account information such as email and creation timestamps. |
| **campaigns.sql** | Represents each D&D campaign created by users. |
| **characters.sql** | Stores details about player characters (stats, name, race, etc.). |
| **items.sql**, **armours.sql**, **weapons.sql**, **shields.sql** | Define items and equipment available in the game, including their attributes and rarity. |
| **logs.sql** | Stores AI-generated event logs for tracking in-game history and debugging. |
| **enemies.sql**, **classes.sql**, **races.sql** | Define various D&D units with their stats and appearances. |
| **character_items.sql** (and similar) | Define linking (“junction”) tables that connect characters with their items, weapons, etc. |

---

###  `services/` – Backend Logic & AI Integration

| File | Description |
|-------|-------------|
| **llm.service.ts** | The main integration with Google’s Gemini AI. It generates game events (like item drops, battles, or narrative descriptions) based on player context and previous events. |

**In short:** This file powers the *“AI Dungeon Master”* behavior.

#### How it works:
1. Builds a detailed “prompt” describing the current game situation.  
2. Sends that prompt to Gemini (Google AI model).  
3. Parses and validates the AI’s JSON response.  
4. Returns an event (e.g., `"A mysterious chest appears."`).

---

###  `types/` – Type Definitions

| File | Description |
|-------|-------------|
| **llm.types.ts** | Contains all data type definitions used by the AI service.<br>Defines what an “event,” “character,” “enemy,” or “effect” looks like in code. |

**Examples of types:**
- `LLMEvent` — The AI-generated event output.  
- `LLMGameContext` — Input describing the player, enemy, and recent history.  
- `EventType` — List of valid event categories (e.g. `NARRATIVE`, `ITEM_DROP`, `COMBAT_ACTION`).

---

###  `utils/` – Reusable Helper Functions

| File | Description |
|-------|-------------|
| **env.ts** | Provides functions for reading environment variables (e.g., API keys). Ensures errors are thrown if required configuration is missing. |

**Example:** Retrieves the Gemini API key securely from `.env`.

---

##  Database Setup & Maintenance

| File | Description |
|-------|-------------|
| **rebuild.sh** | A shell script that:<br>1. Pulls the latest code from GitHub.<br>2. Checks for changes in `rebuild.sql` or any table schema files.<br>3. If there are changes, automatically rebuilds the database. |
| **rebuild.sql** | A “master” SQL script that imports all table definitions from `schema/tables/` in the correct order. |
| **seed.sql** | Adds example data for quick testing (sample accounts, races, items, enemies, etc.). Helps developers set up a working environment immediately after rebuilding the DB. |

---


##  Developer Notes

- All environment variables (like database credentials or API keys) are stored in `.env` and accessed through `utils/env.ts`.  
- Database rebuilds should be done via `rebuild.sh` instead of manually running SQL scripts.  
- AI event generation happens only through `services/llm.service.ts` — **do not call Gemini directly elsewhere.**  
- Cron jobs (`crons/`) are meant for **deployment servers** (e.g., Linode), not local development.

---



