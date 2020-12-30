const moment = require('moment');
import get from 'lodash/get';
import { v4 as uuidv4 } from 'uuid';

import { getUserByEmail, getUserByPhone } from '../hasura/get-user';
import { validateEmail, validatePhone } from '../../validators';
import { STATUS_VERIFIED } from '../../helpers/values';
import { updateUser } from '../hasura/update-user';
import { sendEmailVerifyToken } from '../mail';
import { sendSmsVerifyToken } from '../sms';

export const resendEmail = async (email) => {
  const value = validateEmail(email);
  email = value.email;

  let user = await getUserByEmail(email);

  if (!user) {
    throw new Error('Invalid email provided');
  }

  const fields = {
    email_verified: false,
    email_verify_token: uuidv4() + '-' + (+new Date()),
  };

  const result = await updateUser(user.id, {status: STATUS_VERIFIED}, fields);

  let data = get(result, 'data.update_user_verifications_by_pk');

  if (data !== undefined) {
    await sendEmailVerifyToken(user.username, user.email, data.email_verify_token);

    return true;
  }

  user.user_verifications[0].email_verified ? await updateUser(user.id, {status: user.status}, {
    email_verified: true,
    email_verify_token: null,
  }) : null;

  return false;
}

export const resendPhone = async (phone) => {
  const value = validatePhone(phone);
  phone = value.phone

  let user = await getUserByPhone(phone);

  if (!user) {
    throw new Error('Invalid phone provided');
  }

  const fields = {
    phone_verified: false,
    phone_verify_token: (Math.floor(Math.random() * 90000) + 10000).toString(),
    phone_verify_token_expire: moment().add(5, 'minutes').format('Y-M-D H:mm:ss'),
  };

  const result = await updateUser(user.id, {status: STATUS_VERIFIED}, fields)

  let data = get(result, 'data.update_user_verifications_by_pk');

  if (data !== undefined) {
    await sendSmsVerifyToken(user.phone, data.phone_verify_token);

    return true;
  }

  user.user_verifications[0].phone_verified ? await updateUser(user.id, {status: user.status}, {
    phone_verified: true,
    phone_verify_token: null,
    phone_verify_token_expire: null,
  }) : null;

  return false;
}
