export const isEmail = (email: string): boolean => {
    let mailFormat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
    return mailFormat.test(email);
}

export const isPhone = (phone: string): boolean => {
    let phoneFormat = /^\+?998[0-9]{9}$/;
    return phoneFormat.test(phone);
}