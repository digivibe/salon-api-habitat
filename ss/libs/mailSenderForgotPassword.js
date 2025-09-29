const nodemailer = require('nodemailer')

const sendPassword = async ({ to, subject, html }) => {
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.mailUser || 'coworkingapptest@gmail.com',
            pass: process.env.mailPWD || 'hdcgizyocytxzlhe'
        },
        tls: {
            rejectUnauthorized: false
        }
    })

    let mailOptions = {
        from: `"Nouveau Mot de passe" <${process.env.mailUser || 'presalon.app@gmail.com'}>`,
        to,
        subject,
        html
    }

    try {
        let info = await transporter.sendMail(mailOptions)
        return { success: true, info: info.response }
    } catch (error) {
        return { success: false, error: error.message }
    }
}

module.exports = sendPassword