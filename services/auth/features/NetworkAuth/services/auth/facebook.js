import fetch from 'node-fetch';

import { FACEBOOK_CLIENT_ID, FACEBOOK_CLIENT_SECRET, BASE_URL } from '../../../../core/config';
import { Network } from './network';

export class Facebook extends Network {
  constructor(ctx = null) {
    super(ctx);

    this.clientID = FACEBOOK_CLIENT_ID;
    this.clientSecret = FACEBOOK_CLIENT_SECRET;
    this.callbackUrl = `${BASE_URL}/network/facebook/callback`;
    this.network = 'facebook';
    this.profileFields = ['email', 'id', 'first_name', 'gender', 'last_name', 'picture'];
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByFaceBook(identity);
  }

  getUserInfo = async (token) => {
    try {
      const response = await fetch(`https://graph.facebook.com/me?fields=first_name,last_name,email,gender,picture&access_token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return response.json();
    } catch (e) {
      throw new Error(e.message);
    }
  }
}
