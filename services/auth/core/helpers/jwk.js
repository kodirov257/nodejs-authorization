import { JWK, JWKS, JWT } from 'jose';
import Boom from '@hapi/boom';
import fs from 'fs';

import {
  HASURA_GRAPHQL_CLAIMS_KEY,
  JWT_KEY_FILE_PATH,
  JWT_ALGORITHM,
  JWT_KEY,
} from '../config';

const RSA_TYPES = ['RS256', 'RS384', 'RS512'];
const SHA_TYPES = ['HS256', 'HS384', 'HS512'];

let jwtKey = JWT_KEY;

export const checkEncryptionType = (jwtKey) => {
  if (RSA_TYPES.includes(JWT_ALGORITHM)) {
    if (jwtKey) {
      try {
        jwtKey = JWK.asKey(jwtKey, {alg: JWT_ALGORITHM});
        jwtKey.toPEM(true);
      } catch (error) {
        throw Boom.badImplementation('Invalid RSA private key in the JWT_KEY environment variable.');
      }
    } else {
      try {
        const file = fs.readFileSync(JWT_KEY_FILE_PATH);
        jwtKey = JWK.asKey(file);
      } catch (error) {
        jwtKey = JWK.generateSync('RSA', 2048, {alg: JWT_ALGORITHM, use: 'sig'}, true);
        fs.writeFileSync(JWT_KEY_FILE_PATH, jwtKey.toPEM(true));
      }
    }
  } else if (SHA_TYPES.includes(JWT_ALGORITHM)) {
    if (!jwtKey) {
      throw Boom.badImplementation('Empty JWT secret key.');
    }
  } else {
    throw Boom.badImplementation(`Invalid JWT algorithm: ${JWT_ALGORITHM}`);
  }

  return jwtKey;
}

export const getJwkStore = () => {
  jwtKey = checkEncryptionType(jwtKey);
  if (RSA_TYPES.includes(JWT_ALGORITHM)) {
    const keyStore = new JWKS.KeyStore();
    keyStore.add(jwtKey);
    return keyStore;
  }
  throw Boom.notImplemented('JWKS is not implemented on this server.');
}
