import * as constants from "../helpers/values";
import get from "lodash/get";

import { getUserByEmailVerifyToken, updateUser } from "../services";

let express = require('express');
let router = express.Router();

router.get('/verify-email/:token', async (req, res) => {
    try {
        let user = await getUserByEmailVerifyToken(req.params.token);

        if (!user) {
            throw new Error('Invalid token');
        }

        const fields = {
            email_verified: true,
            email_verify_token: null,
            status: constants.STATUS_ACTIVE,
        };

        const result = updateUser(user.id, fields);

        const data = get(result, 'data.update_users_by_pk');

        if (data !== undefined) {
            res.send({
                data: true,
                result: data,
            });
        }

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