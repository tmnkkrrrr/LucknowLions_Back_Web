const nodemailer = require('nodemailer');


const generateOtp = () => { return Math.floor(1000 + Math.random() * 9000).toString(); }


function generateAlphaNumericString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
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

async function sendForgetPassLink(name, clientID, email) {
    const link = generateAlphaNumericString(12);


    let mailOptions = {
        from: "noreply@lucknowlions.com",
        to: email,
        subject: 'Reset Password Link',
        html: `Dear ${name} Ji, <br /><br />The reset Password Link for your Website Account for Client ID : ${clientID} with Lucknow Lions is : <b>https://www.lucknowlions.com/getin/reset_pass?link=${link}</b> </b> <br /><br />Please enter the above OTP to reset your Password.<br />The Link is valid upto 1 hr.<br /><br />If you didn't request for this OTP, them Please email us : contact@lucknowlions.com .<br /><br />Thanks & Regards Lucknow Lions`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log('Message could not be sent:', error);
        }
        console.log('Message sent:', info.messageId);
    });
    return link;
}


module.exports = sendForgetPassLink;