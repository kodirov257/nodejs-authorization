import {transporter} from "./mail";


export const sendSmsVerifyToken = async (user) => {
    const mailData = {
        from: process.env.MAIL_FROM_ADDRESS,
        to: user.email,
        subject: 'Registration',
        text: 'That was easy!',
        html: `<b>Hey there! </b>
        <br> This is our first message sent with Nodemailer<br/>`,
    };

    await transporter.sendMail(mailData, (error, info) => {
        if (error) {
            console.log(error);
            // throw new Error('The email don`t sent', {
            //     'error': error,
            // });
        }
        return true;
    });
}