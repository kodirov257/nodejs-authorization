import jwt from 'jsonwebtoken';

import { JWT_ALGORITHM } from '../config';

const generateJwtAccessToken = (payload) => {
    const jwtOptions = {
        algorithm: JWT_ALGORITHM,
        expiresIn: `${process.env.JWT_TOKEN_EXPIRES_MIN}m`,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, jwtOptions);
}

export const generateJwtRefreshToken = (payload) => {
    const jwtOptions = {
        algorithm: JWT_ALGORITHM,
        expiresIn: `${process.env.REFRESH_TOKEN_EXPIRES_IN_MIN}m`,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_REFRESH_KEY, jwtOptions);
};

export const generateClaimsJwtToken = (user, sessionId = null) => {
    const headerPrefix = process.env.HASURA_GRAPHQL_HEADER_PREFIX;

    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;

    const payload = {
        [process.env.HASURA_GRAPHQL_CLAIMS_KEY]: {
            [`${headerPrefix}allowed-roles`]: [user.role],
            [`${headerPrefix}default-role`]: user.role,
            [`${headerPrefix}role`]: user.role,
            [`${headerPrefix}user-id`]: user.id.toString(),
            [`${headerPrefix}session-id`]: sessionId,
            [`${headerPrefix}signed-at`]: dateTime,
        },
    };

    return generateJwtAccessToken(payload);
};
