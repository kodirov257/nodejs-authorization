import path from 'path';

export const {
  JWT_KEY,
  JWT_PRIVATE_KEY,
  JWT_ALGORITHM = 'RS256',
  HASURA_GRAPHQL_CLAIMS_KEY = 'https://hasura.io/jwt/claims',
  HASURA_GRAPHQL_HEADER_PREFIX = 'x-hasura-'
} = process.env;

export const JWT_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'core/keys/private.pem');
export const JWT_EXPIRES_IN = process.env.JWT_TOKEN_EXPIRES_MIN || 15;
export const JWT_REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN_MIN || 10080;
