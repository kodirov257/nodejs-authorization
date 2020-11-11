import get from 'lodash/get';
import jwt from "jsonwebtoken";

export const getDataFromVerifiedAuthorizationToken = (req) => {
    const { authorization } = req.headers;

    if (authorization === undefined) {
        return void 0;
    }

    const token = authorization.replace('Bearer ', '');

    try {
        return jwt.verify(token, process.env.JWT_PRIVATE_KEY);
    } catch (e) {
        return void 0;
    }
};

export const isAuthenticated = (req) => {
    return !!getDataFromVerifiedAuthorizationToken(req);
};

const getFieldFromDataAuthorizationToken = (req, field) => {
    const verifiedToken = getDataFromVerifiedAuthorizationToken(req);

    return get(
        verifiedToken, `["${process.env.HASURA_GRAPHQL_CLAIMS_KEY}"]${process.env.HASURA_GRAPHQL_HEADER_PREFIX}${field}`,
    );
};

export const getCurrentUserId = (req) =>
    getFieldFromDataAuthorizationToken(req, 'user-id');