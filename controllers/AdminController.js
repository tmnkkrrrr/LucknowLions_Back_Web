const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require("../database/connect");
const { sendForgetPassOtp, sendWelcome, sendWelcomeEmail } = require("../functions");
const { readAndParseJson } = require("../config/readParsedData");
const generatePassword = require("../utilities/utilities");





router.get('/users', async (req, res) => {
  try {
    const findUser = await pool.execute(
      "SELECT userId, clientID, name, email, mobileNo, isActive, createdAt FROM users");
    if (findUser[0].length === 0) {
      res.status(401).json({ errorMsg: 'No User Exist' });
      return;
    }
    res.status(200).send(findUser[0]);
    return;
  }
  catch (e) {
    console.log(e);
  }
});


router.get('/contact_us_queries', async (req, res) => {
  try {
    const findUser = await pool.execute(
      "SELECT * FROM contactUs");
    if (findUser[0].length === 0) {
      res.status(401).json({ errorMsg: 'No User Exist' });
      return;
    }
    res.status(200).send(findUser[0]);
    return;
  }
  catch (e) {
    console.log(e);
  }
});






router.post('/brokers', async (req, res) => {
  const brokers = req.body; 

    const sql = `
        INSERT INTO brokers (name, link) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE 
        link = VALUES(link);
    `;

    try {
        for (const broker of brokers) {
            await pool.query(sql, [broker.name, broker.link]);
        }
        res.status(200).json({ message: 'Brokers updated successfully' });
    } catch (error) {
        console.error('Error updating brokers:', error);
        res.status(500).json({ error: 'Failed to update brokers' });
    }
});




module.exports = router;
