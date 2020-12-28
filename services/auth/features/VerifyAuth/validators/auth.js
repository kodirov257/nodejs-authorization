const Joi = require('@hapi/joi');

import { validateGeneral } from '../../../core/validators';

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
