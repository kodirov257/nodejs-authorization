import * as constants from "../../helpers/values";
import { v4 as uuidv4 } from "uuid";
import get from "lodash/get";

import { getCurrentUserId, isAuthenticated } from "./user";
import { getUserById } from "../hasura/get-user-by-id";
import { getUserByEmail } from "../hasura/get-user";
import { updateUser } from "../hasura/update-user";
import { validateEmail } from "../../validators";
import { sendEmailResetToken } from "../mail";

export const sendToken = async (email, ctx) => {
    const value = validateEmail(email);
    email = value.email;

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

    if (user.email) {
        throw new Error('Email is already set.');
    }

    const anotherUser = await getUserByEmail(email);
    console.log(anotherUser);

    if (anotherUser) {
        throw new Error('There is already active user with this email.');
    }

    const fields = {
        email: email,
        email_verify_token: uuidv4() + '-' + (+new Date()),
        email_verified: false,
    };

    const result = await updateUser(user.id, fields);
    let data = get(result, 'data.update_users_by_pk');

    if (data !== undefined) {
        await sendEmailResetToken(data.username, data.email, data.email_verify_token);

        return true;
    }

    return false;
}