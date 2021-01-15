import { JWK, JWKS } from 'jose';
import Boom from '@hapi/boom';
import fs from 'fs';

import {
  HASURA_JWT_ALGORITHM,
  JWT_KEY_FILE_PATH,
  JWT_KEY,
} from '../config';

const RSA_TYPES = ['RS256', 'RS384', 'RS512'];
const SHA_TYPES = ['HS256', 'HS384', 'HS512'];

let jwtKey = JWT_KEY;

if (RSA_TYPES.includes(HASURA_JWT_ALGORITHM)) {
  if (jwtKey) {
    try {
      jwtKey = JWK.asKey(jwtKey, {alg: HASURA_JWT_ALGORITHM});
      jwtKey.toPEM(true);
    } catch (error) {
      throw Boom.badImplementation('Invalid RSA private key in the JWT_KEY environment variable.');
    }
  } else {
    try {
      const file = fs.readFileSync(JWT_KEY_FILE_PATH);
      jwtKey.asKey(file);
    } catch (error) {
      jwtKey = JWK.generateSync('RSA', 2048, {alg: HASURA_JWT_ALGORITHM, use: 'sig'}, true);
      fs.writeFileSync(JWT_KEY_FILE_PATH, jwtKey.toPEM(true));
    }
  }
} else if (SHA_TYPES.includes(HASURA_JWT_ALGORITHM)) {
  if (!jwtKey) {
    throw Boom.badImplementation('Empty JWT secret key.');
  }
} else {
  throw Boom.badImplementation(`Invalid JWT algorithm: ${HASURA_JWT_ALGORITHM}`);
}

export const getJwkStore = () => {
  if (RSA_TYPES.includes(HASURA_JWT_ALGORITHM)) {
    const keyStore = new JWKS.KeyStore();
    keyStore.add(jwtKey);
    return keyStore;
  }
  throw Boom.notImplemented('JWKS is not implemented on this server.');
}
