import { UserInputError } from "apollo-server-express";
const Joi = require('@hapi/joi');

export const validateRegistration = (payload) => {
    const schema = Joi.object({
        username: Joi.string().alphanum().min(3).max(30).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    });

    const { value, error } = schema.validate(payload, { abortEarly: false });

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

    const { value, error } = schema.validate(payload, { abortEarly: false });

    if (error) {
        throw new UserInputError('Failed to verify email.', {
            validationErrors: error.details
        });
    }

    return value;
}