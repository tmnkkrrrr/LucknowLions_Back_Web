const pool = require("./connect");

async function checkConnection() {
  try {
    const [rows, fields] = await pool.execute("SELECT 1");
    console.log("Database Connected.");
  } catch (error) {
    console.error("Error checking database connection:", error.message);
  }
}
checkConnection();

const tableUSER = `CREATE TABLE IF NOT EXISTS users (
        userId INT AUTO_INCREMENT PRIMARY KEY,
        clientID VARCHAR(8),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobileNo VARCHAR(12) NOT NULL,
        password VARCHAR(255) NOT NULL,
        isActive INT DEFAULT 1,
        address VARCHAR(80),
        city VARCHAR(20),
        state VARCHAR(15),
        pincode VARCHAR(6),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableBanner = `CREATE TABLE IF NOT EXISTS banner (
          bannerId INT AUTO_INCREMENT PRIMARY KEY,
          title TEXT,
          URL TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableBroker = `CREATE TABLE IF NOT EXISTS brokers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  dematURL VARCHAR(255) NOT NULL,
  logo VARCHAR(255) DEFAULT NULL,
  bgImg VARCHAR(255) DEFAULT NULL,
  typ VARCHAR(10),
  ind INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableMargin = `CREATE TABLE IF NOT EXISTS margin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  segment VARCHAR(255) NOT NULL,
  mis VARCHAR(255) NOT NULL,
  co VARCHAR(255) NOT NULL,
  bo VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

)`;
const tableBrokerage = `CREATE TABLE IF NOT EXISTS brokerage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  segment VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const tableCharges = `CREATE TABLE IF NOT EXISTS charges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  segment VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;


const tableDisBroker = `CREATE TABLE IF NOT EXISTS disBroker (
  brokerId INT AUTO_INCREMENT PRIMARY KEY,
  title TEXT,
  body TEXT,
  chargeTab TEXT,
  marginTab TEXT,
  margin TEXT,
  demateURL TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableFulBroker = `CREATE TABLE IF NOT EXISTS fulBroker (
    brokerId INT AUTO_INCREMENT PRIMARY KEY,
    title TEXT,
    body TEXT,
    chargeTab TEXT,
    marginTab TEXT,
    margin TEXT,
    demateURL TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableNotification = `CREATE TABLE IF NOT EXISTS notification (
        notificationId INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        body VARCHAR(255) NOT NULL,
        url VARCHAR(255),
        isSucceed BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

const tableRefer = `CREATE TABLE IF NOT EXISTS refer (
          referId INT AUTO_INCREMENT PRIMARY KEY,
          fromClient VARCHAR(10) NOT NULL,
          toClient VARCHAR(10) NOT NULL,
          amount INT,
          paid INT DEFAULT 0,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;


try {
  pool.execute(tableUSER);
  pool.execute(tableBanner);
  pool.execute(tableDisBroker);
  pool.execute(tableFulBroker);
  pool.execute(tableBroker);
  pool.execute(tableMargin);
  pool.execute(tableBrokerage);
  pool.execute(tableCharges);
  pool.execute(tableNotification);
  pool.execute(tableRefer);
} catch (e) {
  console.warn(`Failed to Create Table, Reason : ${e}`);
}
