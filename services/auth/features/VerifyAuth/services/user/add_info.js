const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import get from 'lodash/get';

import { getCurrentUserId, isAuthenticated } from '../../../../core/helpers/user';
import { getUserById } from '../../../BasicAuth/services';
import { updateUser } from '../hasura/update-user';
import * as constants from '../../helpers/values';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';

export class AddInfo {
    getUser;
    smsService;
    mailService;
    ctx;
    token;
    phone;
    email;

    constructor({email = null, token = null, phone = null, ctx}) {
        this.getUser = new GetUser();
        this.email = email;
        this.phone = phone ? phone.replace(/^\++/, '') : null;
        this.token = token;
        this.ctx = ctx;
    }

    sendAddInfoToken = async (type = 'email') => {
        if (!isAuthenticated(this.ctx.req)) {
            throw new Error('Authorization token has not provided');
        }

        const currentUserId = getCurrentUserId(this.ctx.req);
        const user = await getUserById(currentUserId, UserFragment);

        if (!user) {
            throw new Error('User not found.');
        }

        if (user.status !== constants.STATUS_ACTIVE) {
            throw new Error('User not activated.');
        }

        const userVerifications = user.user_verifications[0];

        if (type === 'email') {
            if (user.email && user.email === this.email && userVerifications.email_verified === false) {
                return true;
            } else if (user.email && userVerifications.email_verified === true) {
                throw new Error('Email is already set.');
            }
        } else if (type === 'phone') {
            if (user.phone && user.phone === this.phone && userVerifications.phone_verified === false) {
                return this.updateAddInfo(user.id, 'phone');
            } else if (user.phone && userVerifications.phone_verified === true) {
                throw new Error(`Phone number is already set.`);
            }
        }

        const anotherUser = await this.getAnotherUser();

        if (anotherUser && anotherUser.id !== user.id) {
            throw new Error(`There is already active user with this ${type}.`);
        }

        return this.updateAddInfo(user.id, type);
    }

    updateAddInfo = async (userId, type = 'email') => {
        const _fields = {
            emailFields: { email: this.email },
            phoneFields: { phone: this.phone },
        };

        const _verificationFields = {
            emailFields: {
                email_verify_token: uuidv4() + '-' + (+new Date()),
                email_verified: false,
            },
            phoneFields: {
                phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
                phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
                phone_verified: false,
            },
        };

        const result = await updateUser(userId, _fields[`${type}Fields`], _verificationFields[`${type}Fields`]);
        let userData = get(result, 'data.update_users_by_pk');
        let verificationData = get(result, 'data.update_user_verifications_by_pk');

        if (userData !== undefined && verificationData !== undefined) {
            if (type === 'email') {
                await (new this.mailService(userData.username, this.email, verificationData.email_verify_token)).sendAddEmailToken();
            } else if (type === 'phone') {
                await (new this.smsService(this.phone, verificationData.phone_verify_token)).sendSmsAddPhoneToken();
            }

            return true;
        }

        return false;
    }

    addInfo = async (type = 'email') => {
        if (!isAuthenticated(this.ctx.req)) {
            throw new Error('Authorization token has not provided');
        }

        const user = await this.getUserByToken();

        if (!user) {
            throw new Error(`Wrong ${type} is provided.`);
        }

        const userVerifications = user.user_verifications[0];

        this.validateAdd(userVerifications);

        const _fields = {
            emailFields: {
                email_verify_token: null,
                email_verified: true,
            },
            phoneFields: {
                phone_verify_token: null,
                phone_verify_token_expire: null,
                phone_verified: true,
            }
        };

        const result = await updateUser(user.id, {}, _fields[`${type}Fields`]);

        return get(result, 'data.update_users_by_pk') !== undefined && get(result, 'data.update_user_verifications_by_pk') !== undefined;
    }

    validateAdd = (verification) => {}

    getUserByToken = async () => null;

    getAnotherUser = async () => null;
}
