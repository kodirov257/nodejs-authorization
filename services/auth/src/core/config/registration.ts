import envJson from '../../env.json';

export const MAIL_DRIVER: string = envJson.MAIL_DRIVER;
export const MAIL_HOST: string = envJson.MAIL_HOST;
export const MAIL_PORT: number = parseInt(envJson.MAIL_PORT);
export const MAIL_USERNAME: string = envJson.MAIL_USERNAME;
export const MAIL_PASSWORD: string = envJson.MAIL_PASSWORD;
export const MAIL_ENCRYPTION: string = envJson.MAIL_ENCRYPTION;
export const MAIL_FROM_ADDRESS: string = envJson.MAIL_FROM_ADDRESS;
export const MAIL_FROM_NAME: string = envJson.MAIL_FROM_NAME;
export const MAIL_SECURE: boolean = envJson.MAIL_SECURE;
export const SMS_APP_URL: string = envJson.SMS_APP_URL;
export const SMS_USERNAME: string = envJson.SMS_USERNAME;
export const SMS_PASSWORD: string = envJson.SMS_PASSWORD;
export const SMS_SMSC: string = envJson.SMS_SMSC;
export const SMS_FROM: string = envJson.SMS_FROM;
export const SMS_CHARSET: string = envJson.SMS_CHARSET;
export const SMS_CODING: number = envJson.SMS_CODING;