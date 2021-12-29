import Joi from 'joi';

import { validateGeneral } from '../../../core/validators';
import {ResetViaEmailModel, ResetViaPhoneModel} from "../../BasicAuth/models";

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

export const validateEmail = (email: string): {email: string} => {
    return validateGeneral<{email: string}>({email}, {
        email: Joi.string().min(5).max(50).regex(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/).required(),
    }, 'Failed to register the user.');
}

export const validatePhone = (phone: string): {phone: string} => {
    return validateGeneral<{phone: string}>({phone}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
    }, 'Failed to register the user.');
}

export const validateResetViaEmail = (token: string|null, password: string|null): ResetViaEmailModel => {
    return validateGeneral<ResetViaEmailModel>({token, password}, {
        token: Joi.string().regex(/^[\w\d-]+$/).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to reset password.');
}

export const validateResetViaPhone = (phone: string|null, token: string|null, password: string|null): ResetViaPhoneModel => {
    return validateGeneral<ResetViaPhoneModel>({phone, token, password}, {
        phone: Joi.string().regex(/\+?998[0-9]{9}$/).required(),
        token: Joi.string().regex(/^[\d]{5}$/).required(),
        password: Joi.string().min(5).max(50).required(),
    }, 'Failed to reset password.');
}