import {v4 as uuidv4} from 'uuid';
import fetch from 'node-fetch';
import gql from 'graphql-tag';
import get from 'lodash/get';

import { Generator } from '../../../BasicAuth/services/auth/generator';
import * as constants from '../../../../core/helpers/values';
import { hasuraQuery } from '../../../../core/services';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';

export class Network {
  getUserService;
  generator;
  clientID;
  clientSecret;
  callbackUrl;
  network;

  constructor() {
    this.getUserService = new GetUser();
    this.generator = new Generator();
  }

  options = () => {
    return {
      clientID: this.clientID,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackUrl,
      // profileFields: ['id', 'email', 'first_name', 'last_name'],
    };
  }

  callback = (profile, done) => {
    return done(true, profile);
  }

  authorize = async (accessToken) => {
    const userInfo = await this.getUserInfo(accessToken);
    console.log(userInfo);
    // console.log(userInfo.sub);

    if (!userInfo) {
      throw new Error(`Wrong ${this.network} token is provided.`);
    }

    const user = await this.getUser(userInfo.sub);

    // console.log(user);

    if (user) {
      return this.generator.generateTokens(user);
    }

    const params = await this.getParams(userInfo.sub, accessToken);
    console.log(params);

    const result = await hasuraQuery(
      gql`
          ${UserFragment}
          mutation ($user: users_insert_input!) {
              insert_users(objects: [$user]) {
                  returning {
                      ...User
                  }
              }
          }
      `,
      {
        user: params
      }
    );

    const userData = get(result, 'data.insert_users.returning');

    console.log(result);
    console.log(userData);

    if (userData === undefined) {
      throw new Error('Error creating user.');
    }

    return this.generator.generateTokens(userData[0]);
  }

  getUser = async (identity) => null;

  getUserInfo = async (token) => null;

  getParams = async (identity, accessToken) => {
    return {
      username: `${this.network}${identity}`,
      role: constants.ROLE_USER,
      secret_token: uuidv4() + '-' + (+new Date()),
      status: constants.STATUS_ACTIVE,
      user_verifications: {
        data: [{
          phone_verified: false,
          email_verified: false,
        }],
      },
      user_networks: {
        data: [{
          network: this.network,
          identity: identity,
        }],
      },
    };
  };
}
