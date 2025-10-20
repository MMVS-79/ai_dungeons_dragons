# D&D Dragon Combat Demo

A Next.js web application that simulates a dragon combat system with persistent health tracking using MySQL. Players can attack an Ancient Red Dragon and watch its HP decrease in real-time.

## Features

- 🐉 Interactive dragon combat interface
- 💾 Persistent HP tracking with MySQL database
- ⚔️ Real-time damage calculations
- 🎨 Themed UI with dragon and knight graphics
- 🔄 Easy database reset functionality

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download here](https://dev.mysql.com/downloads/mysql/)
- **npm** (comes with Node.js)

## Installation

### 1. Clone or Download the Project

```bash
cd /path/to/project_demo
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:

- Next.js 15.5.4
- React 19
- mysql2 (MySQL client)
- TypeScript

### 3. Configure Database Connection

Open `lib/db.ts` and update the MySQL connection settings if needed:

```typescript
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Add your MySQL root password here
  database: "dnd_game",
  // ... other settings
});
```

**Important:** If your MySQL root user has a password, add it to the `password` field.

### 4. Set Up the Database

#### Option A: Using MySQL Command Line

1. Start MySQL server (if not already running)
2. Run the setup script:

```bash
mysql -u root -p < lib/demo.sql
```

Enter your MySQL password when prompted.

#### Option B: Using MySQL Workbench or Another GUI

1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `lib/demo.sql`
4. Execute the script (it will create the database and insert demo data)

The script will:

- Create a database called `dnd_game`
- Create a `dragon` table with columns: id, name, hp, max_hp, created_at
- Insert an Ancient Red Dragon with 100/100 HP

### 5. Verify Database Setup

You can verify the database was created correctly:

```bash
mysql -u root -p -e "USE dnd_game; SELECT * FROM dragon;"
```

You should see:

```
+----+---------------------+-----+--------+---------------------+
| id | name                | hp  | max_hp | created_at          |
+----+---------------------+-----+--------+---------------------+
|  1 | Ancient Red Dragon  | 100 |    100 | 2025-09-30 ...      |
+----+---------------------+-----+--------+---------------------+
```

## Running the Application

### Development Mode

Start the development server with hot-reloading:

```bash
npm run dev
```

The application will be available at: **<http://localhost:3000>**

### Production Mode

Build and run the optimized production version:

```bash
npm run build
npm start
```

## Project Structure

```
project_demo/
├── app/
│   ├── api/
│   │   └── dragon/
│   │       └── route.ts       # Dragon API endpoints (GET/POST)
│   ├── page.tsx               # Main game UI
│   ├── layout.tsx             # Root layout
│   └── Home.module.css        # Styling
├── lib/
│   ├── db.ts                  # MySQL database connection pool
│   └── demo.sql               # Database setup script
├── public/
│   ├── Background2.png        # Game background
│   ├── Dragon2.png            # Dragon sprite
│   ├── Knight.png             # Knight sprite
│   └── Hit.png                # Hit effect
└── package.json
```

## API Endpoints

### GET `/api/dragon`

Fetches current dragon stats.

**Response:**

```json
{
  "success": true,
  "dragon": {
    "id": 1,
    "name": "Ancient Red Dragon",
    "hp": 100,
    "max_hp": 100,
    "created_at": "2025-09-30T..."
  }
}
```

### POST `/api/dragon`

Attacks the dragon and reduces HP.

**Request Body:**

```json
{
  "damage": 15
}
```

**Response:**

```json
{
  "success": true,
  "dragon": {
    "id": 1,
    "name": "Ancient Red Dragon",
    "hp": 85,
    "max_hp": 100,
    "created_at": "2025-09-30T..."
  },
  "damageDelt": 15
}
```

## Resetting the Demo

To reset the dragon's HP back to 100/100, simply run the SQL script again:

```bash
mysql -u root -p < lib/demo.sql
```

Or execute the script through your MySQL GUI tool.

## Troubleshooting

### Database Connection Issues

**Error:** `Access denied for user 'root'@'localhost'`

- **Solution:** Check your MySQL password in `lib/db.ts`

**Error:** `Database 'dnd_game' doesn't exist`

- **Solution:** Run the `lib/demo.sql` script to create the database

### Port Already in Use

**Error:** `Port 3000 is already in use`

- **Solution:** Stop other processes using port 3000, or specify a different port:

  ```bash
  PORT=3001 npm run dev
  ```

### MySQL Not Running

**Error:** `connect ECONNREFUSED 127.0.0.1:3306`

- **Solution:** Start your MySQL server:
  - **macOS:** `brew services start mysql` or `mysql.server start`
  - **Windows:** Start MySQL service from Services panel
  - **Linux:** `sudo systemctl start mysql`

## Technologies Used

- **Next.js 15.5** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **MySQL2** - MySQL client for Node.js
- **Turbopack** - Fast bundler for development

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [React Documentation](https://react.dev/)

## License

This is a demo project for educational purposes.
