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
    const headers = req.headers;
    const headerPrefix = process.env.HASURA_GRAPHQL_HEADER_PREFIX!;

    if (headers === undefined || headers[headerPrefix+'role'] === 'anonymous') {
        return !!getDataFromVerifiedAuthorizationToken(req);
    }

    return true;
}

const getFieldFromDataAuthorizationToken = (req: Request, field: string) => {
    const claimsKey = process.env.HASURA_GRAPHQL_CLAIMS_KEY!;
    const headerPrefix = process.env.HASURA_GRAPHQL_HEADER_PREFIX!;
    const headers = req.headers;

    const data = get(
        headers,
        `${process.env.HASURA_GRAPHQL_HEADER_PREFIX}${field}`,
    );

    if (data === undefined) {
        const verifiedToken = getDataFromVerifiedAuthorizationToken(req);

        return get(verifiedToken, `["${claimsKey}"]${headerPrefix}${field}`);
    }

    return data;
}

export const getCurrentUserId = (req: Request) => getFieldFromDataAuthorizationToken(req, 'user-id');