import fetch from 'node-fetch';
import {
	SMS_UZ_APP_URL,
	SMS_USERNAME,
	SMS_PASSWORD,
	SMS_CHARSET,
	SMS_CODING,
	SMS_FROM,
	SMS_SMSC,
} from '../../../core/config/registration';

export class Sms {
	phone;
	token;

	constructor(phone, token) {
		this.phone = phone;
		this.token = token;
	}

	sendSmsVerifyToken = async () => {
		const text = `Enter the verification code: ${this.token}`;

		return this.sendSms(text);
	}

	sendSmsResetToken = async () => {
		const text = `Enter the code to reset: ${this.token}`;

		return this.sendSms(text);
	}

	sendSmsAddPhoneToken = async () => {
		const text = `Enter the code to add phone: ${this.token}`;

		return this.sendSms(text);
	}

	sendSms = async (text) => {
		console.log('Phone number: ' + this.phone);
		const params = `username=${SMS_USERNAME}&password=${SMS_PASSWORD}&smsc=${SMS_SMSC}&from=${SMS_FROM}&to=${this.phone}&charset=${SMS_CHARSET}&coding=${SMS_CODING}&text=${encodeURI(text)}`

		const request = await fetch(`${SMS_UZ_APP_URL}${params}`);
		console.log(request);

		return true;
	}
}
