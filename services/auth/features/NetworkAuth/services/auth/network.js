import {v4 as uuidv4} from 'uuid';
import gql from 'graphql-tag';
import get from 'lodash/get';

import {Generator} from '../../../BasicAuth/services/auth/generator';
import * as constants from '../../../../core/helpers/values';
import {hasuraQuery} from '../../../../core/services';
import {UserFragment} from '../../fragments';
import {GetUser} from '../hasura/get-user';

export class Network {
  getUserService;
  generator;
  clientID;
  clientSecret;
  callbackUrl;
  profileFields;
  network;

  constructor() {
    this.getUserService = new GetUser();
    this.generator = new Generator();
    this.profileFields = [];
  }

  options = () => {
    return {
      clientID: this.clientID,
      clientSecret: this.clientSecret,
      callbackURL: this.callbackUrl,
      ...this.profileFields.length > 0 ? {profileFields: this.profileFields} : {},
    };
  }

  callback = (profile, done) => {
    return done(true, profile);
  }

  authorize = async (accessToken) => {
    console.log('dsadhgqwgdljksadaskjdajslkd');
    const userInfo = await this.getUserInfo(accessToken);
    console.log(userInfo);
    console.log(userInfo.id);

    if (!userInfo || userInfo.error) {
      throw new Error(`Wrong ${this.network} token is provided.`);
    }

    const userId = this.getUserId(userInfo);
    console.log(userId);

    const user = await this.getUser(userId);

    // console.log(user);

    if (user) {
      return this.generator.generateTokens(user);
    }

    const params = await this.getParams(userId, accessToken);
    // console.log(params);

    const result = await hasuraQuery(
      gql`
          ${UserFragment}
          mutation ($user: auth_users_insert_input!) {
              insert_auth_users(objects: [$user]) {
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

    const userData = get(result, 'data.insert_auth_users.returning');

    // console.log(result);
    // console.log(userData);

    if (userData === undefined) {
      throw new Error('Error creating user.');
    }

    return this.generator.generateTokens(userData[0]);
  }

  getUser = async (identity) => null;

  getUserInfo = async (token) => null;

  getUserId = (user) => {
    return user.id;
  }

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
