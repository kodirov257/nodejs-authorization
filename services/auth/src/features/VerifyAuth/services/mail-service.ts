import Mailer from 'nodemailer/lib/mailer';
import nodemailer from 'nodemailer';

import { IMailServiceResolver } from '../../../core/resolvers';
import {
    MAIL_FROM_ADDRESS,
    MAIL_PASSWORD,
    MAIL_USERNAME,
    MAIL_SECURE,
    MAIL_HOST,
    FRONT_URL,
    MAIL_PORT,
} from '../../../core/config';

export class MailService implements IMailServiceResolver {
    private readonly username: string;
    private readonly email: string;
    private readonly emailVerifyToken: string;
    private transporter: nodemailer.Transporter;

    constructor(username: string, email: string, emailVerifyToken: string) {
        this.username = username;
        this.email = email;
        this.emailVerifyToken = emailVerifyToken;

        this.transporter = nodemailer.createTransport({
            port: MAIL_PORT,
            host: MAIL_HOST,
            auth: {
                user: MAIL_USERNAME,
                pass: MAIL_PASSWORD,
            },
            secure: MAIL_SECURE,
        });
    }

    public async sendEmailVerifyToken(): Promise<boolean> {
        const mailData: Mailer.Options = {
            from: MAIL_FROM_ADDRESS,
            to: this.email,
            subject: 'Registration',
            text: `Thanks for registration!
                \nPlease refer to the following link:
                \n${FRONT_URL}/auth/login?token=${this.emailVerifyToken}
                \nThank you,
                \n${this.username}
            `,
            html: `<b>Thanks for registration!</b>
                <br>Please refer to the following link:<br/>
                <p><a href="${FRONT_URL}/auth/login?token=${this.emailVerifyToken}">Verify Email</a></p>
                Thank you,<br>
                ${this.username}
            `,
        };

        await this.transporter.sendMail(mailData, (error: Error|null, info) => {
            if (error) {
                throw new Error(`Tha email is not sent ${error.toString()}`/*, {
                    'error': error,
                }*/);
            }

            return true;
        });

        return true;
    }

    public async sendEmailResetToken(): Promise<boolean> {
        const mailData: Mailer.Options = {
            from: MAIL_FROM_ADDRESS,
            to: this.email,
            subject: 'Reset password',
            text: `Thanks for using our service!
                \nPlease refer to the following link:
                \n${FRONT_URL}/auth/login?token=${this.emailVerifyToken}
                \nto reset your password.
                \nThank you,
                \n${this.username}
            `,
            html: `<br>Thanks for using our service!<br/>
                <br>Please refer to the following link:<br/>
                <p><a href="${FRONT_URL}/auth/reset-password?token=${this.emailVerifyToken}">Reset password</a></p>
                to reset your password.<br>
                Thank you,<br>
                ${this.username}
            `,
        };

        await this.transporter.sendMail(mailData, (error: Error|null, info) => {
            if (error) {
                throw new Error(`Tha email is not sent ${error.toString()}`/*, {
                    'error': error,
                }*/);
            }

            return true;
        });

        return true;
    }
}