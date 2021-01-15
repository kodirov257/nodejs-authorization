import { Network } from './network';

export class Facebook extends Network {
  constructor() {
    super();

    this.clientID = process.env.FACEBOOK_CLIENT_ID;
    this.clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    this.callbackUrl = `${process.env.BASE_URL}/network/facebook/callback`;
    this.network = 'facebook';
  }

  getUser = async (identity) => {
    return this.getUserService.getUserByFaceBook(identity);
  }
}
