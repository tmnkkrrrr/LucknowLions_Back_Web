const express = require("express");
const router = express.Router();
const pool = require("../database/connect");



router.get('/brokersLing', async (req, res) => {
    try {
        const findBrokers = await pool.execute("SELECT brokerId, name, link FROM brokers");
        res.status(200).send(findBrokers[0]);
    }
    catch (e) {
        console.log(e);
    }
});


router.post('/contact_us', async (req, res) => {
    console.table(req.body);
    try {
        const { firstName, middleName, lastName, email, phoneNumber, subject, message } = req.body;
        if (middleName == undefined) middleName = '';

        const changeState = await pool.execute(
            `INSERT INTO contactUs(firstName, middleName, lastName, email, phoneNumber, subject, message) VALUES( ?, ?, ?, ?, ?, ?, ? )`, [firstName, middleName, lastName, email, phoneNumber, subject, message]);
        console.log(changeState[0]);
        if (changeState[0].affectedRows > 0) {

            const insertId = changeState[0].insertId;
            const ticketId = "Lkons_Hp_" + (10100 + insertId);
            await pool.execute(
                "UPDATE contactUs SET ticketId = ? WHERE id = ?", [ticketId, insertId]);

            res.status(200).send({ ticket: ticketId });
            return;
        }
        res.status(201).send({ msg: 'Failed!' });
    }
    catch (e) {
        console.log(e);
    }
});





module.exports = router;