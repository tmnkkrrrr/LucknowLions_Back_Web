const axios = require('axios');
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');
const fs = require('fs');
const mysql = require('mysql2');
const { exec } = require('child_process');


function generateOtp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

const transporter = nodemailer.createTransport({
    host: 'smtp.sparkpostmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'SMTP_Injection',
        pass: '8864b161c42e12b6aa865ed4a6a13bc09fb8560e'
    },
});

async function sendForgetPassOtp(name, phone) {
    const otp = generateOtp();
    const url = `http://37.59.76.46/api/mt/SendSMS?user=Lucknow-Lions&password=q12345&senderid=LKOEDS&channel=Trans&DCS=0&flashsms=0&number=91${phone}&text=Dear ${name} Ji, Your forget password OTP is - ${otp} Please enter the above OTP and set a new password for login. Thanks %26 Regards Lucknow Lions&DLTTemplateId=1207171765063926159&TelemarketerId=12071651285xxxxxxx&Peid=1201159267295852195&route=21`;

    try {
        const response = await axios.get(url);
        console.log('OTP sent successfully:', response.data);
        return otp;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

async function sendNewRegistrationOtp(name, phone) {
    const otp = generateOtp();
    const url = `http://37.59.76.46/api/mt/SendSMS?user=Lucknow-Lions&password=q12345&senderid=LKOLNS&channel=Trans&DCS=0&flashsms=0&number=91${phone}&text=Dear ${name} Ji, Your Mobile registration verification OTP is - ${otp} Please enter the above OTP and proceed for login. Thanks %26 Regards Lucknow Lions`;

    try {
        const response = await axios.get(url);
        console.log('OTP sent successfully:', response.data);
        return otp;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

async function sendWelcome(clientID, name, phone, pass) {
    const url = `http://37.59.76.46/api/mt/SendSMS?user=Lucknow-Lions&password=q12345&senderid=LKOLNS&channel=Trans&DCS=0&flashsms=0&number=91${phone}&text=Dear ${name} Ji, You have successfully registered with us. Your Login credentials are below Client ID:- ${clientID} Password: ${pass} Please enter the above credentials for login. Thanks %26 Regards Lucknow Lions`;

    try {
        const response = await axios.get(url);
        console.log('OTP sent successfully:', response.data);
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
}

async function sendWelcomeEmail(email, name, clientID, pass) {
    let mailOptions = {
        from: "noreply@lucknowlions.com",
        to: email,
        subject: 'Welcome to Lucknow Lions',
        html: `Dear ${name} Ji, <br /><br />You have successfully registered with us. Your Login credentials are below <br />Client ID:- <b>${clientID}</b> <br />Password: <b>${pass}</b> <br /><br />Please enter the above credentials for login.<br />Thanks & Regards Lucknow Lions`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Message could not be sent:', error);
        }
        console.log('Message sent:', info.messageId);
    });
}

async function sendServerRestartEmail(email) {
    let mailOptions = {
        from: "noreply@lucknowlions.com",
        to: email,
        subject: 'LkoLns Server Restarted',
        html: `Lucknow Lions Server Restarted at `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Message could not be sent:', error);
        }
        console.log('Message sent:', info.messageId);
    });
}

async function sendDbBackup(backupFileName) {

        let mailOptions = {
            from: "noreply@lucknowlions.com",
            to: `DB_BACKUP "${process.env.EMAIL}"`,
            subject: 'LKO LNS DB Backup',
            html: `Lucknow Lions Server Database Backup`,
            attachments: [
                {
                    filename: backupFileName,
                    path: `./database/${backupFileName}`
                }
            ]
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error.message);
                return;
            }
            console.log('Email sent successfully:', info.response);

            // Delete the backup file after sending email
            fs.unlink(`./database/${backupFileName}`, (err) => {
                if (err) {
                    console.error('Error deleting backup file:', err.message);
                    return;
                }
                console.log(`Backup file ${backupFileName} deleted successfully.`);
            });
        });
    
}

module.exports = { sendForgetPassOtp, sendNewRegistrationOtp, sendWelcome, sendWelcomeEmail, sendServerRestartEmail, sendDbBackup };