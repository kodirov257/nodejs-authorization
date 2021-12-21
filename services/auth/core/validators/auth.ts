import Joi from 'joi';
import { UserInputError } from 'apollo-server-express';

export const validateRegistration = (username: string, email_or_phone: string, password: string) => {
    return validateGeneral<{username: string, email_or_phone: string, password: string}>({username, email_or_phone, password}, {
        username: Joi.string().alphanum().min(3).max(50).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to register the user.');
}

export const validateGeneral = <T>(payload: any, validator: any, errorMessage: string): T => {
    const schema = Joi.object(validator);

    const { value, error } = schema.validate(payload, { abortEarly: false });

    if (error) {
        throw new UserInputError(errorMessage, {
            validationErrors: error.details
        });
    }

    return value;
}