import gql from 'graphql-tag';
import get from 'lodash/get';

import { GetUser as VerifyGetUser } from '../../../VerifyAuth/services/hasura/get-user';
import { UserFragment, UserNetworkFragment } from '../../fragments';
import { getUserById } from '../../../BasicAuth/services';
import { hasuraQuery } from '../../../../core/services';

export class GetUser extends VerifyGetUser {
  getUserByFaceBook = async (identity) => {
    return this.getUserByNetwork('facebook', identity);
  }

  getUserByGoogle = async (identity) => {
    return this.getUserByNetwork('google', identity);
  }

  getUserByVkontakte = async (identity) => {
    return this.getUserByNetwork('vkontakte', identity);
  }

  getUserByNetwork = async (network, identity) => {
    const userNetwork = await this.getUserNetwork(network, 'identity', identity);
    if (!userNetwork) {
      return null;
      // throw new Error('Wrong identity is provided.');
    }
    return getUserById(userNetwork.user_id, UserFragment);
  }

  getUserNetwork = async (network, attribute, value, fragment = UserNetworkFragment) => {
    try {
      let condition = {};
      let where = {network: { _eq: network }};
      where[attribute] = { _eq: value };
      condition.where = where;
      const response = await hasuraQuery(
        gql`
            ${fragment}
            query($where: auth_user_networks_bool_exp) {
                auth_user_networks(where: $where) {
                    ...UserNetwork
                }
            }
        `,
        condition,
      );

      return get(response, 'data.auth_user_networks[0]');
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
