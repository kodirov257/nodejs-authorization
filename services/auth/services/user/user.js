import get from 'lodash/get';

export const isAuthenticated = (req) => {
  const headers = req.headers;

  if (headers === undefined || headers[process.env.HASURA_GRAPHQL_HEADER_PREFIX + 'role'] === 'anonymous') {
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