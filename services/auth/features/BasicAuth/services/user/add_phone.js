import { validatePhone } from '../../../../core/validators';
import { AddInfo } from './add_info';

export class AddPhone extends AddInfo {
  constructor({phone, ctx}) {
    super({phone, ctx});
  }

  addPhone = async () => {
    validatePhone(this.phone);

    return this.addInfo('phone');
  }

  getAnotherUser = async () => this.getUser.getUserByPhone(this.phone);
}
