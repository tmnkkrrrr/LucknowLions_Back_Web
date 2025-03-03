const express = require("express");
const router = express.Router();
const pool = require("../database/connect");
const sendForgetPassLink = require("../helper/helper");



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


router.put('/reset_pass_otp', async (req, res) => {
    try {
        if (!(req.body.email)) {
            res.status(400).send("Please Fill All Deatils !!!");
            return;
        }
        const { email } = req.body;

        const [checkEmail] = await pool.execute(
            `SELECT clientID, name FROM users WHERE email = ? AND isActive = 1`, [email]);

        if (!checkEmail.length) {
            res.status(400).send({ msg: 'Retry' });
            return;
        }

        const clientID = checkEmail[0].clientID;

        if (clientID && checkEmail[0].name) {
            const link = await sendForgetPassLink(checkEmail[0].name, clientID, email);

            const [reset_pass_link] = await pool.execute(
                `INSERT INTO resetPassLink (clientID, resetLink) VALUES (?, ?)`, [clientID, link]);
            res.status(200).send({ msg: 'success', link });
            return;
        }

        res.status(400).send({ msg: 'NOT Found!' });
    }
    catch (e) {
        console.log(e);
    }
});


router.get('/validate_reset_pass_link', async (req, res) => {
    try {
        if (!(req.query.link)) {
            res.status(400).send("Please Fill All Deatils !!!");
            return;
        }
        const { link } = req.query;

        const [checkLink] = await pool.execute(
            `SELECT clientID FROM resetPassLink WHERE resetLink = ? AND create_time > NOW() - INTERVAL 1 HOUR`, [link]);

        if (!checkLink.length) {
            res.status(400).send({ msg: 'Retry' });
            return;
        }

        const clientID = checkLink[0].clientID;

        if (clientID) {
            res.status(200).send({ msg: 'success', clientID });
            return;
        }

        res.status(400).send({ msg: 'NOT Found!' });
    }
    catch (e) {
        console.log(e);
    }
});


router.post('/reset_pass_link', async (req, res) => {
    try {
        if (!(req.body.link || req.body.password)) {
            res.status(400).send("Please Fill All Deatils !!!");
            return;
        }
        const { link, password } = req.body;

        const [checkLink] = await pool.execute(
            `SELECT clientID FROM resetPassLink WHERE resetLink = ? AND create_time > NOW() - INTERVAL 1 HOUR`, [link]);


        if (checkLink[0].clientID) {
            const clientID = checkLink[0].clientID;

            await pool.execute(`UPDATE users SET password = ? WHERE ClientID = ?`, [password, clientID]);
            await pool.execute(`Delete FROM resetPassLink WHERE resetLink = ?`, [link]);

            res.status(200).send({ msg: 'success' });
            return;
        }

        res.status(400).send({ msg: 'NOT Found!' });
    }
    catch (e) {
        console.log(e);
    }
});




module.exports = router;