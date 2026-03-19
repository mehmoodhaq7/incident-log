const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

const promisePool = pool.promise();

promisePool
  .getConnection()
  .then((conn) => {
    console.log("✅ MySQL Connected");
    conn.release();
  })
  .catch((err) => {
    console.error("❌ MySQL Connection Failed:", err.message);
  });

module.exports = promisePool;
