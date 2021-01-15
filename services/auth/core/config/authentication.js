import path from 'path';

process.env.JWT_ALGORITHM = 'HS256';
process.env.HASURA_JWT_ALGORITHM = 'RS256';

export const {
  JWT_KEY,
  JWT_PRIVATE_KEY,
  JWT_ALGORITHM = 'HS256',
  HASURA_JWT_ALGORITHM = 'RS256',
  JWT_CLAIMS_NAMESPACE = 'https://hasura.io/jwt/claims',
} = process.env;

export const JWT_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'core/keys/private.pem');
export const JWT_EXPIRES_IN = process.env.JWT_TOKEN_EXPIRES_MIN || 15;
export const JWT_REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN_MIN || 43200;
