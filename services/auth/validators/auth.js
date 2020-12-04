import { UserInputError } from "apollo-server-express";
const Joi = require('@hapi/joi');

export const validateRegistration = (username, emailOrPhone, password) => {
    return validateGeneral({username, emailOrPhone, password}, {
        username: Joi.required().string().alphanum().min(3).max(30),
        email_or_phone: Joi.required().string().min(5).max(50),
        password: Joi.required().string().min(5).max(50),
    }, 'Failed to register the user.');
}

export const validateVerifyEmail = (token) => {
    return validateGeneral({token}, {
        token: Joi.required().string().regex(/^[\w\d-]+$/)
    }, 'Failed to verify email.');
}

export const validateVerifyPhone = (phone, token) => {
    return validateGeneral({phone, token}, {
        token: Joi.required().string().regex(/^[\d]{5}$/),
        phone: Joi.required().string().regex(/\+?998[0-9]{9}$/),
    }, 'Failed to verify phone.');
}

export const validateEmail = (email) => {
    return validateGeneral({email}, {
        email: Joi.required().string().min(5).max(50).regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/),
    }, 'Failed to register the user.');
}

export const validatePhone = (phone) => {
    return validateGeneral({phone}, {
        phone: Joi.required().string().regex(/\+?998[0-9]{9}$/),
    }, 'Failed to register the user.');
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