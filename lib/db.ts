import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Add your MySQL root  password here
  database: "dnd_game",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export default pool;
