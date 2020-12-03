import { UserInputError } from "apollo-server-express";
const Joi = require('@hapi/joi');

export const validateRegistration = (username, emailOrPhone, password) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    });

    const { value, error } = schema.validate({username, emailOrPhone, password}, { abortEarly: false });

    if (error) {
        throw new UserInputError('Failed to register the user.', {
            validationErrors: error.details
        });
    }

    return value;
}

export const validateVerifyEmail = (token) => {
    const schema = Joi.object({
        token: Joi.string().regex(/^[\w\d-]+$/)
    });

    const { value, error } = schema.validate({token}, { abortEarly: false });

    if (error) {
        throw new UserInputError('Failed to verify email.', {
            validationErrors: error.details
        });
    }

    return value;
}

export const validateVerifyPhone = (phone, token) => {
    const schema = Joi.object({
        token: Joi.string().regex(/^[\d]{5}$/),
        phone: Joi.string().regex(/\+?998[0-9]{9}$/)
    });

    const { value, error } = schema.validate({phone, token}, { abortEarly: false });

    if (error) {
        throw new UserInputError('Failed to verify phone.', {
            validationErrors: error.details
        });
    }

    return value;
}