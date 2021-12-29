import fetch, { Response } from 'node-fetch';

import { ISmsServiceResolver } from '../../../core/resolvers';
import {
    SMS_APP_URL,
    SMS_CHARSET,
    SMS_CODING,
    SMS_FROM,
    SMS_PASSWORD,
    SMS_SMSC,
    SMS_USERNAME
} from '../../../core/config';

export class Sms implements ISmsServiceResolver {
    private readonly phone: string;
    private readonly token: string;

    public constructor(phone: string, token: string) {
        this.phone = phone;
        this.token = token;
    }

    public async sendSmsVerifyToken(): Promise<boolean> {
        const text: string = `Enter the verification code: ${this.token}`;

        return this.sendSms(text);
    }

    public async sendSmsResetToken(): Promise<boolean> {
        const text: string = `Enter the code to reset: ${this.token}`;

        return this.sendSms(text);
    }

    private sendSms = async (text: string): Promise<boolean> => {
        console.log('Phone number: ' + this.phone);
        const params: string = `username=${SMS_USERNAME}&password=${SMS_PASSWORD}&smsc=${SMS_SMSC}&from=${SMS_FROM}&to=${this.phone}&charset=${SMS_CHARSET}&coding=${SMS_CODING}&text=${encodeURI(text)}`;

        const request: Response = await fetch(`${SMS_APP_URL}${params}`);
        console.log(request);

        return true;
    }
}