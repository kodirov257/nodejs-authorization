import * as nodemailer from 'nodemailer';

import {
	MAIL_FROM_ADDRESS,
	MAIL_PASSWORD,
	MAIL_USERNAME,
	MAIL_SECURE,
	MAIL_PORT,
	MAIL_HOST,
	FRONT_URL,
} from '../../../core/config';

export class Mail {
	username;
	email;
	emailVerifyToken;
	transporter;

	constructor(username, email, emailVerifyToken) {
		this.username = username ? username : email;
		this.email = email;
		this.emailVerifyToken = emailVerifyToken;

		this.transporter = nodemailer.createTransport({
			port: MAIL_PORT,
			host: MAIL_HOST,
			auth: {
				user: MAIL_USERNAME,
				pass: MAIL_PASSWORD,
			},
			secure: typeof MAIL_SECURE === 'boolean' ? (MAIL_SECURE !== false) : MAIL_SECURE !== 'false',
		});
	}

	sendEmailVerifyToken = async () => {
		const mailData = {
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

		console.log(mailData);

		await this.transporter.sendMail(mailData, (error, info) => {
			if (error) {
				throw new Error('The email is not sent' + ` ${error.toString()}`, {
					'error': error,
				});
			}
			return true;
		});
	}

	sendEmailResetToken = async () => {
		const mailData = {
			from: MAIL_FROM_ADDRESS,
			to: this.email,
			subject: 'Reset password',
			text: `Thanks for using our service!
            \nPlease refer to the following link:
            \n${FRONT_URL}/auth/reset-password?token=${this.emailVerifyToken}
            \nThank you,
            \n${this.username}
        `,
			html: `<b>Thanks for using our service!</b>
            <br>Please refer to the following link:<br/>
            <p><a href="${FRONT_URL}/auth/reset-password?token=${this.emailVerifyToken}">Reset password</a></p>
            Thank you,<br>
            ${this.username}
        `,
		};

		console.log(mailData);

		await this.transporter.sendMail(mailData, (error, info) => {
			if (error) {
				throw new Error('The email is not sent', {
					'error': error,
				});
			}
			return true;
		});
	}

	sendAddEmailToken = async () => {
		const mailData = {
			from: MAIL_FROM_ADDRESS,
			to: this.email,
			subject: 'Add email',
			text: `Thanks for using our service!
            \nPlease refer to the following link:
            \n${FRONT_URL}/user/add-email?token=${this.emailVerifyToken}
            \nThank you,
            \n${this.username}
        `,
			html: `<b>Thanks for using our service!</b>
            <br>Please refer to the following link:<br/>
            <p><a href="${FRONT_URL}/user/add-email?token=${this.emailVerifyToken}">Add email</a></p>
            Thank you,<br>
            ${this.username}
        `,
		};

		console.log(mailData);

		await this.transporter.sendMail(mailData, (error, info) => {
			if (error) {
				throw new Error('The email is not sent', {
					'error': error,
				});
			}
			return true;
		});
	}
}
