import { v4 as uuidv4 } from 'uuid';
import gql from 'graphql-tag';
import get from 'lodash/get';
import { JWT } from 'jose';

import { checkEncryptionType } from '../../../../core/helpers/jwk';
import { hasuraQuery } from '../../../../core/services';
import {
  HASURA_GRAPHQL_HEADER_PREFIX,
  HASURA_GRAPHQL_CLAIMS_KEY,
  JWT_REFRESH_EXPIRES_IN,
  JWT_EXPIRES_IN,
  JWT_ALGORITHM,
  JWT_KEY,
} from '../../../../core/config';

export class Generator {
  jwtKey;
  newJwtExpiry;

  constructor() {
    this.jwtKey = checkEncryptionType(JWT_KEY);
    this.newJwtExpiry = JWT_REFRESH_EXPIRES_IN * 60 * 1000;
  }

  generateTokens = async (user, request = null) => {
    const ipAddress = request ? (
      request.headers['x-forwarded-for'] || request.connection.remoteAddress || ''
    ).split(',')[0].trim() : '';
    const userAgent = request ? request.headers['user-agent'] : null;

    const [refreshToken, sessionId] = await this.createUserSession(user, userAgent, ipAddress);

    const accessToken = await this.generateClaimsJwtToken(user, sessionId);

    return {
      access_token: accessToken,
      refresh_token: this.generateJwtRefreshToken({
        token: refreshToken,
      }),
      expires_at: `${this.getExpiresDate().getTime()}`,
      user_id: user.id,
    };
  }

  createUserSession = async (user, userAgent = null, ipAddress = null) => {
    const refreshToken = uuidv4() + '-' + (+new Date());
    try {
      const expiresAt = this.getExpiresDate();

      const result = await hasuraQuery(
        gql`
            mutation ($userSessionData: [auth_user_sessions_insert_input!]!) {
                insert_auth_user_sessions(objects: $userSessionData) {
                    returning {
                        id
                    }
                }
            }
        `,
        {
          userSessionData: {
            user_id: user.id,
            expires_at: expiresAt,
            refresh_token: refreshToken,
            user_agent: userAgent,
            ip_address: ipAddress,
          }
        }
      );

      const sessionId = get(result, 'data.insert_auth_user_sessions.returning[0].id');
      if (sessionId === undefined) {
        return Promise.reject(new Error('Error to create the user session.'));
      }

      return [refreshToken, sessionId];
    } catch (e) {
      throw new Error('Could not create "session" for user');
    }
  }

  getExpiresDate = () => new Date(Date.now() + this.newJwtExpiry);

  generateJwtAccessToken = (payload) =>
    JWT.sign(payload, this.jwtKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: `${JWT_EXPIRES_IN}m`
    });

  generateJwtRefreshToken = (payload) =>
    JWT.sign(payload, this.jwtKey, {
      algorithm: JWT_ALGORITHM,
      expiresIn: `${JWT_REFRESH_EXPIRES_IN}m`
    });

  generateClaimsJwtToken = (user, sessionId = null) =>
    this.generateJwtAccessToken({[HASURA_GRAPHQL_CLAIMS_KEY]: this.generatePermissionVariables({user, sessionId}, true)});

  generatePermissionVariables = ({ account_roles = [], user, sessionId }, jwt = true) => {
    const headerPrefix = jwt ? HASURA_GRAPHQL_HEADER_PREFIX : '';

    const accountRoles = account_roles.map(({ role: roleName }) => roleName);
    if (!accountRoles.includes(user.role)) {
      accountRoles.push(user.role);
    }

    return  {
      [`${headerPrefix}allowed-roles`]: accountRoles,
      [`${headerPrefix}default-role`]: user.role,
      [`${headerPrefix}role`]: user.role,
      [`${headerPrefix}user-id`]: user.id.toString(),
      [`${headerPrefix}session-id`]: sessionId,
    };
  }
}
