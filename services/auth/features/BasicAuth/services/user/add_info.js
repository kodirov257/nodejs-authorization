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
  type;

  constructor({email = null, phone = null, type = 'email', ctx}) {
    this.getUser = new GetUser();
    this.email = email;
    this.phone = phone ? phone.replace(/^\++/, '') : null;
    this.type = type;
    this.ctx = ctx;
  }

  addInfo = async () => {
    if (!isAuthenticated(this.ctx.req)) {
      throw new Error('Authorization token has not provided');
    }

    const currentUserId = getCurrentUserId(this.ctx.req);
    const user = await getUserById(currentUserId, this.getUserFragment());
    // console.log(user);

    if (!user) {
      throw new Error('User not found.');
    }

    if (user.status !== constants.STATUS_ACTIVE) {
      throw new Error('User not activated.');
    }

    let validatedData = this.validateAddInfo(user, this.type);
    if (validatedData === true || validatedData.hasOwnProperty('userData')) {
      return validatedData;
    }

    const anotherUser = await this.getAnotherUser();

    if (anotherUser && anotherUser.id !== user.id) {
      throw new Error(`There is already active user with this ${this.type}.`);
    }

    return this.sendAddInfo(user.id, this.type);
  }

  validateAddInfo = (user) => {
    if (this.type === 'email' && user.email) {
      throw new Error('Email is already set.');
    } else if (this.type === 'phone' && user.phone) {
      throw new Error(`Phone number is already set.`);
    }
    return false;
  }

  sendAddInfo = async (userId) => {
    let {userData} = await this.updateAddInfo(userId);
    return userData;
  }

  updateAddInfo = async (userId) => {
    const _fields = {
      emailFields: { email: this.email },
      phoneFields: { phone: this.phone },
    };

    const result = await updateUser(userId, _fields[`${this.type}Fields`]);
    if (!result) {
      throw new Error(`${this.type} is not added.`);
    }

    return {result};
  }

  getUserFragment = () => UserFragment;

  getAnotherUser = async () => null;
}
