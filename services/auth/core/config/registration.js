import path from 'path';
import fs from 'fs';

const fileName = path.resolve(__dirname, '../../env.json');
const environment = JSON.parse(fs.readFileSync(fileName, 'utf-8'));

export const {
  DEFAULT_USER_ROLE = 'user',
  DEFAULT_ANONYMOUS_ROLE = 'anonymous',
} = process.env;

export const MAIL_DRIVER = environment.MAIL_DRIVER;
export const MAIL_HOST = environment.MAIL_HOST;
export const MAIL_PORT = environment.MAIL_PORT;
export const MAIL_USERNAME = environment.MAIL_USERNAME;
export const MAIL_PASSWORD = environment.MAIL_PASSWORD;
export const MAIL_ENCRYPTION = environment.MAIL_ENCRYPTION;
export const MAIL_FROM_ADDRESS = environment.MAIL_FROM_ADDRESS;
export const MAIL_FROM_NAME = environment.MAIL_FROM_NAME;
export const MAIL_SECURE = environment.MAIL_SECURE;

export const SMS_UZ_APP_URL = environment.SMS_UZ_APP_URL;
export const SMS_USERNAME = environment.SMS_USERNAME;
export const SMS_PASSWORD = environment.SMS_PASSWORD;
export const SMS_SMSC = environment.SMS_SMSC;
export const SMS_FROM = environment.SMS_FROM;
export const SMS_CHARSET = environment.SMS_CHARSET;
export const SMS_CODING = environment.SMS_CODING;