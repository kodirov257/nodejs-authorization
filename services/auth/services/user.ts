import { Request } from 'express';
import jwt from 'jsonwebtoken';
import lodash from 'lodash';

const { get } = lodash;

export const getDataFromVerifiedAuthorizationToken = (req: Request) => {
    const { authorization } = req.headers;

    if (authorization === undefined) {
        return void 0;
    }

    const token = authorization.replace('Bearer ', '');

    try {
        return jwt.verify(token, process.env.JWT_PRIVATE_KEY!);
    } catch (e) {
        return void 0;
    }
}

export const isAuthenticated = (req: Request) => {
    return !!getDataFromVerifiedAuthorizationToken(req);
}

const getFieldFromDataAuthorizationToken = (req: Request, field: string) => {
    const claimsKey = process.env.HASURA_GRAPHQL_CLAIMS_KEY!;
    const headerPrefix = process.env.HASURA_GRAPHQL_HEADER_PREFIX!;

    const verifiedToken = getDataFromVerifiedAuthorizationToken(req);

    return get(verifiedToken, `["${claimsKey}"]${headerPrefix}${field}`);
}

export const getCurrentUserId = (req: Request) => getFieldFromDataAuthorizationToken(req, 'user-id');