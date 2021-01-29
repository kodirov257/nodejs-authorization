import fetch from 'node-fetch';

import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, BASE_URL } from '../../../../core/config';
import { Network } from './network';

export class Google extends Network {
  constructor(ctx = null) {
    super(ctx);

    this.clientID = GOOGLE_CLIENT_ID;
    this.clientSecret = GOOGLE_CLIENT_SECRET;
    this.callbackUrl = `${BASE_URL}/network/google/callback`;
    this.network = 'google';
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByGoogle(identity);
  }

  getUserInfo = async (token) => {
    try {
      const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`, {
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

  getUserId = (user) => Number.isInteger(user.sub) ? user.sub.toString() : user.sub;
}
