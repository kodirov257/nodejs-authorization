import fetch from 'node-fetch';

import { VKONTAKTE_CLIENT_ID, VKONTAKTE_CLIENT_SECRET, BASE_URL } from '../../../../core/config';
import { Network } from './network';

export class VKontakte extends Network {
  constructor(ctx = null) {
    super(ctx);

    this.clientID = VKONTAKTE_CLIENT_ID;
    this.clientSecret = VKONTAKTE_CLIENT_SECRET;
    this.callbackUrl = `${BASE_URL}/network/vkontakte/callback`;
    this.network = 'vkontakte';
    this.profileFields = ['email', 'id', 'first_name', 'gender', 'last_name', 'picture'];
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByVkontakte(identity);
  }

  getUserInfo = async (token) => {
    const response = await fetch(`https://api.vk.com/method/users.get?fields=uid,first_name,last_name,screen_name,sex,photo_200&access_token=${token}&v=5.126`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    let responseJson = await response.json();

    return responseJson.response[0];
  }
}
