const moment = require('moment');
import jwt from 'jsonwebtoken';
import get from 'lodash/get';
import {v4 as uuidv4} from "uuid";

import { getUserById, getUserSession } from '../index';
import { generateClaimsJwtToken } from "../../helpers/auth-tools";

export const refreshToken = async (signedRefreshToken) => {
    const refreshToken = getToken(signedRefreshToken);

    const userSession = await getUserSession(refreshToken);

    const expireData = moment(userSession.expires_at);
    if (!expireData.isAfter()) {
        throw new Error('Session is expired.');
    }

    const user = await getUserById(userSession.user_id);
    const accessToken = await generateClaimsJwtToken(user, uuidv4() + '-' + (+new Date()));

    return {
        access_token: accessToken,
    };
}

const getDataFromRefreshToken = (refreshToken) => {
    return jwt.verify(refreshToken, process.env.JWT_PRIVATE_REFRESH_KEY);
}

const getFieldFromRefreshToken = (refreshToken, field) => {
    const verifiedToken = getDataFromRefreshToken(refreshToken);

    return get(
        verifiedToken,
        `${field}`,
    );
}

const getToken = (refreshToken) =>
    getFieldFromRefreshToken(refreshToken, 'token');
