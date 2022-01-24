import { UserInputError } from 'apollo-server-express';
import Joi from 'joi';

import { ChangePasswordForm, RegistrationForm } from '../forms';

export const validateRegistration = (username: string, email_or_phone: string, password: string): RegistrationForm => {
    return validateGeneral<RegistrationForm>({username, email_or_phone, password}, {
        username: Joi.string().alphanum().min(3).max(50).required(),
        email_or_phone: Joi.string().min(5).max(50).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to register the user.');
}

export const validateChangePassword = (oldPassword: string, newPassword: string): ChangePasswordForm => {
    return validateGeneral<ChangePasswordForm>({oldPassword, newPassword}, {
        oldPassword: Joi.string().min(5).max(50).required(),
        newPassword: Joi.string().min(5).max(50).required(),
    }, 'Failed to change password.');
}

export const validateEmail = (email: string|null, message: string = 'Failed to register the user.'): {email: string} => {
    return validateGeneral<{email: string}>({email}, {
        email: Joi.string().min(5).max(50).regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/).required(),
    }, message);
}

export const validatePhone = (phone: string|null, message: string = 'Failed to register the user.'): {phone: string} => {
    return validateGeneral<{phone: string}>({phone}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
    }, message);
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