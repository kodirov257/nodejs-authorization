import path from 'path';
import fs from 'fs';

const fileName = path.resolve(__dirname, '../../env.json');
const environment = JSON.parse(fs.readFileSync(fileName, 'utf-8'));

export const FACEBOOK_CLIENT_ID = environment.FACEBOOK_CLIENT_ID;
export const FACEBOOK_CLIENT_SECRET = environment.FACEBOOK_CLIENT_SECRET;
export const GOOGLE_CLIENT_ID = environment.GOOGLE_CLIENT_ID;
export const GOOGLE_CLIENT_SECRET = environment.GOOGLE_CLIENT_SECRET;
export const VKONTAKTE_CLIENT_ID = environment.VKONTAKTE_CLIENT_ID;
export const VKONTAKTE_CLIENT_SECRET = environment.VKONTAKTE_CLIENT_SECRET;