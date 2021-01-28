import get from 'lodash/get';

import { getCurrentUserId, isAuthenticated } from '../../../../core/helpers/user';
import * as constants from '../../../../core/helpers/values';
import { getUserById } from '../hasura/get-user-by-id';
import { updateUser } from '../hasura/update-user';
import { UserFragment } from '../../fragments';
import { GetUser } from '../hasura/get-user';

export class AddInfo {
  getUser;
  ctx;
  phone;
  email;

  constructor({email = null, phone = null, ctx}) {
    this.getUser = new GetUser();
    this.email = email;
    this.phone = phone ? phone.replace(/^\++/, '') : null;
    this.ctx = ctx;
  }

  addInfo = async (type = 'email') => {
    if (!isAuthenticated(this.ctx.req)) {
      throw new Error('Authorization token has not provided');
    }

    const currentUserId = getCurrentUserId(this.ctx.req);
    const user = await getUserById(currentUserId, this.getUserFragment());
    console.log(user);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.status !== constants.STATUS_ACTIVE) {
      throw new Error('User not activated.');
    }

    let validatedData = this.validateAddInfo(user, type);
    if (validatedData === true || validatedData.hasOwnProperty('userData')) {
      return validatedData;
    }

    const anotherUser = await this.getAnotherUser();

    if (anotherUser && anotherUser.id !== user.id) {
      throw new Error(`There is already active user with this ${type}.`);
    }

    return this.sendAddInfo(user.id, type);
  }

  validateAddInfo = (user, type = 'email') => {
    if (type === 'email' && user.email) {
      throw new Error('Email is already set.');
    } else if (type === 'phone' && user.phone) {
      throw new Error(`Phone number is already set.`);
    }
    return false;
  }

  sendAddInfo = async (userId, type = 'email') => {
    let {userData} = await this.updateAddInfo(userId);
    return userData !== undefined;
  }

  updateAddInfo = async (userId) => {
    const _fields = {
      emailFields: { email: this.email },
      phoneFields: { phone: this.phone },
    };

    const result = await updateUser(userId, _fields[`${type}Fields`]);
    let userData = get(result, 'data.update_auth_users_by_pk');

    return {userData};
  }

  getUserFragment = () => UserFragment;

  getAnotherUser = async () => null;
}
