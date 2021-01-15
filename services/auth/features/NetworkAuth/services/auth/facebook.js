import { Network } from './network';
import fetch from 'node-fetch';

export class Facebook extends Network {
  constructor() {
    super();

    this.clientID = process.env.FACEBOOK_CLIENT_ID;
    this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    this.callbackUrl = `${process.env.BASE_URL}/network/facebook/callback`;
    this.network = 'facebook';
    this.profileFields = ['email', 'id', 'first_name', 'gender', 'last_name', 'picture'];
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByFaceBook(identity);
  }

  getUserInfo = async (token) => {
    const response = await fetch(`https://graph.facebook.com/me?fields=first_name,last_name,email,gender,picture&access_token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return response.json();
  }
}
