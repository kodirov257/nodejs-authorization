const moment = require('moment');
import { v4 as uuidv4 } from 'uuid';
import get from 'lodash/get';

import { AddInfo as BasicAddInfo } from '../../../BasicAuth/services/user/add_info';
import { isAuthenticated } from '../../../../core/helpers/user';
import { updateUser } from '../hasura/update-user';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';
import { Mail } from '../mail';
import { Sms } from '../sms';

export class AddInfo extends BasicAddInfo {
    mailService;
    smsService;
    token;

    constructor({email = null, token = null, phone = null, type = 'email', ctx}) {
        super({email, phone, type, ctx});

        this.getUser = new GetUser();
        this.token = token;
        this.mailService = Mail;
        this.smsService = Sms;
    }

    validateAddInfo = (user) => {
        const userVerifications = user.user_verifications[0];

        if (this.type === 'email') {
            if (user.email && user.email === this.email && userVerifications.email_verified === false) {
                return true;
            } else if (user.email && userVerifications.email_verified === true) {
                throw new Error('Email is already set.');
            }
        } else if (this.type === 'phone') {
            if (user.phone && user.phone === this.phone && userVerifications.phone_verified === false) {
                return this.sendAddInfo(user.id, 'phone');
            } else if (user.phone && userVerifications.phone_verified === true) {
                throw new Error(`Phone number is already set.`);
            }
        }
        return false;
    }

    sendAddInfo = async (userId) => {
        let {userData, verificationData} = await this.updateAddInfo(userId, this.type);

        if (userData && verificationData) {
            if (this.type === 'email') {
                await (new this.mailService(userData.username, this.email, verificationData.email_verify_token)).sendAddEmailToken();
            } else if (this.type === 'phone') {
                await (new this.smsService(this.phone, verificationData.phone_verify_token)).sendSmsAddPhoneToken();
            }

            return true;
        }

        return false;
    }

    updateAddInfo = async (userId) => {
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

        const {userData, verificationData} = await updateUser(userId, _fields[`${this.type}Fields`], _verificationFields[`${this.type}Fields`]);

        if (!userData || !verificationData) {
            throw new Error(`${this.type} is not added.`);
        }

        return {userData, verificationData};
    }

    verifyAddInfo = async () => {
        if (!isAuthenticated(this.ctx.req)) {
            throw new Error('Authorization token has not provided');
        }

        const user = await this.getUserByToken();

        if (!user) {
            throw new Error(`Wrong ${this.type} is provided.`);
        }

        const userVerifications = user.user_verifications[0];

        this.validateVerifyAddInfo(userVerifications);

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

        const result = await updateUser(user.id, {}, _fields[`${this.type}Fields`]);

        if (!result.user || !result.verification) {
            throw new Error(`${this.type} addition is not verified.`);
        }

        return true;
    }

    getUserFragment = () => UserFragment;

    validateVerifyAddInfo = (verification) => {}

    getUserByToken = async () => null;

    getAnotherUser = async () => null;
}
