import {getUserByEmailVerifyToken, hasuraQuery} from "../services";
import gql from "graphql-tag";
import {UserRegistrationFragment} from "../fragments";
import * as constants from "../helpers/values";
import get from "lodash/get";
import fetch from "node-fetch";

let express = require('express');
let router = express.Router();

router.get('/verify-email/:token', async (req, res) => {
    // try {
    //     const response = await fetch(process.env.BASE_URL + '/graphql', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             Accept: 'application/json',
    //             // 'x-hasura-admin-secret': 'losandijoncity!@$@'
    //             // ...getDefaultHeaders(),      // TODO: fix environments
    //         },
    //         body: `mutation {verify_email(token: ${req.params.token})}`
    //     });
    //
    //     res.send({
    //         data: true,
    //         result: result
    //     });
    // } catch (e) {
    //     res.send({
    //         data: false,
    //         error: {
    //             message: e.message,
    //         }
    //     });
    // }

    try {
        let user = await getUserByEmailVerifyToken(req.params.token);

        if (!user) {
            throw new Error('Invalid token');
        }

        const result = await hasuraQuery(
            gql`
                ${UserRegistrationFragment}
                mutation ($user: users_set_input, $id: users_pk_columns_input!) {
                    update_users_by_pk(_set: $user, pk_columns: $id) {
                        ...User
                    }
                }
            `,
            {
                user: {
                    email_verified: true,
                    email_verify_token: null,
                    status: constants.STATUS_ACTIVE,
                },
                id: {
                    id: user.id,
                }
            }
        );

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