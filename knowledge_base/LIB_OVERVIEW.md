# Library (`lib/`) Overview

This folder contains all backend logic and automation scripts that support the D&D web application.  
It includes database management tools, AI integration services, type definitions, game engine logic, utility functions, and testing scaffolds.

Each section below describes the purpose of the folders and files in this directory.

---

## Folder Overview

| Folder / File | Purpose |
|----------------|----------|
| **crons/** | Contains automated tasks (cron jobs) that run at scheduled times on the server, such as cleaning logs or rebuilding the database. |
| **schema/tables/** | Holds individual SQL files that define the structure (tables, columns, and relationships) of the project’s MySQL database. |
| **services/** | Contains service modules used by the app — for example, AI integration (`llm.service.ts`) and the game engine (`gameEngine.service.ts`). |
| **types/** | Stores TypeScript type definitions that describe data structures and API contracts between parts of the system (`llm.types.ts`, `game.types.ts`). |
| **utils/** | Includes small utility scripts for managing configuration, environment variables, and helper logic shared by other modules (`env.ts`, `eventUtils.ts`, `statCalc.ts`). |
| **scripts/** | Contains miscellaneous scripts for setup, deployment, or other project-related automation tasks. |
| **db.ts** | Handles the connection setup to the MySQL database using environment variables. |
| **rebuild.sh** | A shell script that automatically rebuilds the database schema whenever changes are detected. Used on the server. |
| **rebuild.sql** | The SQL script that runs all table creation scripts in the correct order — the “master setup” for the database. |
| **seed.sql** | Fills the database with sample (test) data like default accounts, enemies, items, and characters. |

---

## Details by Folder

### `crons/` – Automated Scheduled Tasks

| File | Description |
|-------|-------------|
| **logprune** | Deletes or empties `.log` files daily to prevent them from growing too large.<br>**Schedule:** Runs once per day at midnight. |
| **ai_dnd_db_rebuild** | Rebuilds the database automatically at regular intervals (every minute by default).<br>**Purpose:** Ensures the database schema stays up-to-date with recent code changes. |

---

### `schema/tables/` – Database Table Definitions

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

### `services/` – Backend Logic, Game Engine & AI Integration

| File | Description |
|-------|-------------|
| **llm.service.ts** | Integrates with Google’s Gemini AI to generate game events (item drops, battles, narrative events) based on player context and history. |
| **gameEngine.service.ts** | Contains the core game engine logic.<br>Responsibilities include: validating player actions, determining event outcomes, calculating combat/stat changes, and interacting with the database to update state. |

---

### `types/` – Type Definitions

| File | Description |
|-------|-------------|
| **llm.types.ts** | Contains AI-related data type definitions (events, characters, enemies, effects). |
| **game.types.ts** | Contains types related to the game engine, including player actions, event structures, combat mechanics, and stat calculations. |

---

### `utils/` – Reusable Helper Functions

| File | Description |
|-------|-------------|
| **env.ts** | Provides functions for reading environment variables (API keys, DB credentials) and throws errors if required variables are missing. |
| **eventUtils.ts** | Helper functions for processing game events, e.g., mapping AI events to engine-understood formats, checking event validity. |
| **statCalc.ts** | Functions for calculating stats, damage, and derived values (e.g., HP after attack, defense modifiers). |

---

### `scripts/` – Automation & Miscellaneous Scripts

| File | Description |
|-------|-------------|
| *(examples TBD)* | Placeholder for scripts such as deployment helpers, backups, or other devops-related automation. |

---

### `test/` – Testing & Validation

| File | Description |
|-------|-------------|
| **example.test.tsx** | Sample Jest/React tests for basic UI or component behavior. |
| **llm.test.ts** | Tests for AI integration (`llm.service.ts`) including event parsing and validation. |
| **gameEngine.test.ts** | Unit tests for the game engine logic (`gameEngine.service.ts`), combat outcomes, and event transitions. |
| **combat.test.ts** | Focused tests on combat resolution logic (attacks, damage calculation, flee, item usage). |
| **api.test.ts** | Tests for API routes or endpoints, ensuring backend routes return correct data and update the database correctly. |

---

## Database Setup & Maintenance

| File | Description |
|-------|-------------|
| **rebuild.sh** | Pulls latest code and rebuilds the database automatically when `rebuild.sql` or schema files change. |
| **rebuild.sql** | “Master” SQL script that imports all table definitions from `schema/tables/` in the correct order. |
| **seed.sql** | Adds example data for quick testing (accounts, races, items, enemies, etc.). |

---

## Developer Notes

- Environment variables (DB credentials, API keys) are accessed through `utils/env.ts`.  
- All AI event generation should occur through `services/llm.service.ts` only.  
- Cron jobs (`crons/`) run on deployment servers, not local dev environments.  
- Game engine (`services/gameEngine.service.ts`) handles all validation, calculations, and DB updates related to game turns, events, and combat.  
- Test folder contains unit and integration tests to ensure logic, API endpoints, and UI components behave correctly.  

---

