import * as nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    port: process.env.MAIL_PORT,
    host: process.env.MAIL_HOST,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
    secure: process.env.MAIL_SECURE !== 'false',
});

export const sendEmailVerifyToken = async (user) => {
    const mailData = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Registration',
        text: `Thanks for registration!
            \nPlease refer to the following link:
            \n${process.env.BASE_URL}/verify-email/${user.email_verify_token}
            \nThank you,
            \n${user.username}
        `,
        html: `<b>Thanks for registration!</b>
            <br>Please refer to the following link:<br/>
            <p><a href="${process.env.BASE_URL}/verify-email/${user.email_verify_token}">Verify Email</a></p>
            Thank you,<br>
            ${user.username}
        `,
    };

    console.log(mailData);

    await transporter.sendMail(mailData, (error, info) => {
        if (error) {
            throw new Error('The email is not sent', {
                'error': error,
            });
        }
        return true;
    });
}

export const sendEmailResetToken = async (user) => {
    const mailData = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Reset password',
        text: `Thanks for using our service!
            \nPlease refer to the following link:
            \n${process.env.BASE_URL}/user/reset-password/${user.email_verify_token}
            \nThank you,
            \n${user.username}
        `,
        html: `<b>Thanks for using our service!</b>
            <br>Please refer to the following link:<br/>
            <p><a href="${process.env.BASE_URL}/user/reset-password/${user.email_verify_token}">Reset password</a></p>
            Thank you,<br>
            ${user.username}
        `,
    };

    console.log(mailData);

    await transporter.sendMail(mailData, (error, info) => {
        if (error) {
            throw new Error('The email is not sent', {
                'error': error,
            });
        }
        return true;
    });
}