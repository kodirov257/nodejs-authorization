import fetch from "node-fetch";

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
		const params = `username=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&smsc=${process.env.SMS_SMSC}&from=${process.env.SMS_FROM}&to=${this.phone}&charset=${process.env.SMS_CHARSET}&coding=${process.env.SMS_CODING}&text=${encodeURI(text)}`

		const request = await fetch(`${process.env.SMS_UZ_APP_URL}${params}`);
		console.log(request);

		return true;
	}
}
