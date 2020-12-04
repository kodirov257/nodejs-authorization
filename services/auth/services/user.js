import get from 'lodash/get';
import bcrypt from "bcryptjs";

import * as constants from "../helpers/values";
import { getUserById } from "./hasura/get-user-by-id";
import { updateUser } from "./hasura/update-user";
import {validateChangePassword} from "../validators";

export const changePassword = async (oldPassword, newPassword, ctx) => {
    if (!isAuthenticated(ctx.req)) {
        throw new Error('Authorization token has not provided');
    }

    const currentUserId = getCurrentUserId(ctx.req);
    const user = await getUserById(currentUserId);

    if (!user) {
        throw new Error('User not found.');
    }

    if (user.status !== constants.STATUS_ACTIVE) {
        throw new Error('User not activated.');
    }

    validateChangePassword(oldPassword, newPassword);

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid "password".');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const fields = {
        password: passwordHash,
    };

    const result = await updateUser(user.id, fields)

    return get(result, 'data.update_users_by_pk') !== undefined;
}

export const isAuthenticated = (req) => {
    const headers = req.headers;

    if (headers === undefined || headers[process.env.HASURA_GRAPHQL_HEADER_PREFIX+'role'] === 'anonymous') {
        return void 0;
    }

    return true;
};

export const getCurrentUserId = (req) =>
    getFieldFromDataAuthorizationToken(req, 'user-id');

const getFieldFromDataAuthorizationToken = (req, field) => {
    const headers = req.headers;

    return get(
        headers,
        `${process.env.HASURA_GRAPHQL_HEADER_PREFIX}${field}`,
    );
};