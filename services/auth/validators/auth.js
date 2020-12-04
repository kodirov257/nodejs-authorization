import { UserInputError } from "apollo-server-express";
const Joi = require('@hapi/joi');

export const validateRegistration = (username, emailOrPhone, password) => {
    return validateGeneral({username, emailOrPhone, password}, {
        username: Joi.string().alphanum().min(3).max(30).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to register the user.');
}

export const validateVerifyEmail = (token) => {
    return validateGeneral({token}, {
        token: Joi.string().regex(/^[\w\d-]+$/).required()
    }, 'Failed to verify email.');
}

export const validateVerifyPhone = (phone, token) => {
    return validateGeneral({phone, token}, {
        token: Joi.string().regex(/^[\d]{5}$/).required(),
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
    }, 'Failed to verify phone.');
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

export const validateResetViaEmail = (token, password) => {
    return validateGeneral({token, password}, {
        token: Joi.string().regex(/^[\w\d-]+$/).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to reset password.');
}

export const validateResetViaPhone = (phone, token, password) => {
    return validateGeneral({phone, token, password}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
        token: Joi.string().regex(/^[\d]{5}$/).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to reset password.');
}

const validateGeneral = (payload, validator, errorMessage) => {
    const schema = Joi.object(validator);

    const { value, error } = schema.validate(payload, { abortEarly: false });

    if (error) {
        throw new UserInputError(errorMessage, {
            validationErrors: error.details
        });
    }

    return value;
}