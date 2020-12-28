import { UserInputError } from "apollo-server-express";
const Joi = require('@hapi/joi');

export const validateRegistration = (username, emailOrPhone, password) => {
    return validateGeneral({username, emailOrPhone, password}, {
        username: Joi.string().alphanum().min(3).max(30).required(),
        emailOrPhone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to register the user.');
}

export const validateEmail = (email) => {
    return validateGeneral({email}, {
        email: Joi.string().min(5).max(50).regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/).required(),
    }, 'Failed to register the user.');
}

export const validatePhone = (phone) => {
    return validateGeneral({phone}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
    }, 'Failed to register the user.');
}

export const validateChangePassword = (oldPassword, newPassword) => {
    return validateGeneral({oldPassword, newPassword}, {
        oldPassword: Joi.string().min(5).max(50).required(),
        newPassword: Joi.string().min(5).max(50).required(),
    }, 'Failed to change password.');
}

export const validateGeneral = (payload, validator, errorMessage) => {
    const schema = Joi.object(validator);

    const { value, error } = schema.validate(payload, { abortEarly: false });

    if (error) {
        throw new UserInputError(errorMessage, {
            validationErrors: error.details
        });
    }

    return value;
}
