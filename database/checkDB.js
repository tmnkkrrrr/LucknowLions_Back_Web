const pool = require("./connect");

async function checkConnection() {
  try {
    await pool.execute("SELECT 1");
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


const tableBrokerage = `CREATE TABLE IF NOT EXISTS brokerage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  broker_id INT NOT NULL,
  segment VARCHAR(255) NOT NULL,
  value VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;

const tableBrokers = `CREATE TABLE IF NOT EXISTS brokers (
                      brokerId INT,
                      name VARCHAR(255) PRIMARY KEY,
                      link TEXT,
                      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;


const tableContactUs = `CREATE TABLE IF NOT EXISTS contactUs (
                        id INT AUTO_INCREMENT PRIMARY KEY,  
                        ticketId VARCHAR(20),
                        firstName VARCHAR(100),
                        middleName VARCHAR(100),
                        lastName VARCHAR(100),
                        email VARCHAR(100),
                        phoneNumber VARCHAR(20),
                        subject VARCHAR(100),
                        message TEXT,
                        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;
                    
const tableSitemap = `CREATE TABLE IF NOT EXISTS sitemap (
                          id INT AUTO_INCREMENT PRIMARY KEY,  
                          url text,
                          priority double,
                          lastModify TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`;

try {
  pool.execute(tableUSER);
  pool.execute(tableBanner);
  pool.execute(tableBrokerage);
  pool.execute(tableBrokers);
  pool.execute(tableContactUs);
  pool.execute(tableSitemap);
} catch (e) {
  console.warn(`Failed to Create Table, Reason : ${e}`);
}
