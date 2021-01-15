import { Network } from './network';
import fetch from "node-fetch";

export class Google extends Network {
  constructor() {
    super();

    this.clientID = process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    this.callbackUrl = `${process.env.BASE_URL}/network/google/callback`;
    this.network = 'google';
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByGoogle(identity);
  }

  getUserInfo = async (token) => {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return response.json();
  }

  getUserId = (user) => {
    return user.sub;
  }
}
