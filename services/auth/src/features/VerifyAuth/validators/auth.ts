import Joi from 'joi';

import { validateGeneral } from '../../../core/validators';

export const validateVerifyEmail = (token: string): {token: string} => {
    return validateGeneral<{token: string}>({token}, {
        token: Joi.string().regex(/^[\w\d-]+$/).required()
    }, 'Failed to verify email');
}

export const validateVerifyPhone = (phone: string|null, token: string): {phone: string, token: string} => {
    return validateGeneral<{phone: string, token: string}>({phone, token}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
        token: Joi.string().regex(/^[\d]{5}$/).required(),
    }, 'Failed to verify phone.');
}