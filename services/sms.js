import fetch from "node-fetch";

export const sendSmsVerifyToken = async (phone, token) => {
    const text = `Enter the verification code: ${token}`;

    return sendSms(phone, text);
}

export const sendSmsResetToken = async (phone, token) => {
    const text = `Enter the code to reset: ${token}`;

    return sendSms(phone, text);
}

const sendSms = async (phone, text) => {
    console.log('Phone number: ' + phone);
    const params = `username=${process.env.SMS_USERNAME}&password=${process.env.SMS_PASSWORD}&smsc=${process.env.SMS_SMSC}&from=${process.env.SMS_FROM}&to=${phone}&charset=${process.env.SMS_CHARSET}&coding=${process.env.SMS_CODING}&text=${encodeURI(text)}`

    const request = await fetch(`${process.env.SMS_UZ_APP_URL}${params}`);
    console.log(request);

    return true;
}