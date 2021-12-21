import jwt, { Algorithm } from 'jsonwebtoken';

import { JwtOptions, User } from '../models';

export const generateJwtAccessToken = (payload: any): string => {
    const tokenExpiresIn = +process.env.JWT_TOKEN_EXPIRES!
    const jwtOptions: JwtOptions = {
        algorithm: process.env.JWT_ALGORITHM! as Algorithm,
        expiresIn: `${tokenExpiresIn}m`,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY!, jwtOptions);
}

export const generateJwtRefreshToken = (payload: any): string => {
    const refreshTokenTime = +process.env.REFRESH_TOKEN_EXPIRES_IN!;
    const jwtOptions: JwtOptions = {
        algorithm: process.env.JWT_ALGORITHM as Algorithm,
        expiresIn: `${refreshTokenTime}m`,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY!, jwtOptions);
}

export const generateClaimsJwtToken = (user: User, sessionId: string|null = null): string => {
    const headerPrefix: string = process.env.HASURA_GRAPHQL_HEADER_PREFIX!;

    let today: Date = new Date();
    let date: string = `${today.getFullYear()}-${(today.getMonth()+1)}-${today.getDate()}`;
    let time: string = `${`0${today.getHours()}`.slice(-2)}:${`0${today.getMinutes()}`.slice(-2)}:${`0${today.getSeconds()}`.slice(-2)}`;
    let dateTime: string = `${date} ${time}`;

    const payload: any = {
        [process.env.HASURA_GRAPHQL_CLAIMS_KEY!]: {
            [`${headerPrefix}allowed-roles`]: [user.role],
            [`${headerPrefix}default-role`]: user.role,
            [`${headerPrefix}role`]: user.role,
            [`${headerPrefix}user-id`]: user.id,
            [`${headerPrefix}session-id`]: sessionId,
            [`${headerPrefix}signed-at`]: dateTime,
        },
    };

    return generateJwtAccessToken(payload);
}