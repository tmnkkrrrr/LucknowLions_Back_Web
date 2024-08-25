const mysql = require('mysql2');

const dbConfig = {
    host: process.env.DB_Host,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
};

const pool = mysql.createPool(dbConfig);


module.exports = pool.promise(); 