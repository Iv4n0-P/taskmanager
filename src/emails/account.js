const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ivankoperisic@gmail.com',
        subject: `Welcome ${name} to our app!`,
        text: 'This is welcome mail body text'
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ivankoperisic@gmail.com',
        subject: `Goodbye ${name}.`,
        html: '<h1>We are sorry to see you go.</h1>'
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}