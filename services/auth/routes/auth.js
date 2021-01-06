import * as constants from '../features/VerifyAuth/helpers/values';
import get from 'lodash/get';

import { GetUser, updateUser } from '../features/VerifyAuth/services';

let express = require('express');
let router = express.Router();

router.get('/verify-email/:token', async (req, res) => {
    try {
        let user = await (new GetUser()).getUserByEmailVerifyToken(req.params.token);

        if (!user) {
            throw new Error('Invalid token');
        }

        const result = await updateUser(user.id, {status: constants.STATUS_ACTIVE}, {
            email_verified: true,
            email_verify_token: null,
        });

        const data = get(result, 'data.update_users_by_pk');
        const dataVerification = get(result, 'data.update_user_verifications_by_pk');

        if (data !== undefined && dataVerification !== undefined) {
            res.send({
                data: true,
                result: data,
            });
        }

        await updateUser(user.id, {status: user.status}, {
            email_verified: true,
            email_verify_token: null,
        });

        res.send({
            data: false,
        });
    } catch (e) {
        res.send({
            data: false,
            error: {
                message: e.message,
            }
        });
    }


});

module.exports = router;
