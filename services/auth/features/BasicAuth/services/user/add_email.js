import { validateEmail } from '../../../../core/validators';
import { AddInfo } from './add_info';

export class AddEmail extends AddInfo {
  constructor({email = null, ctx}) {
    super({email, ctx});
  }

  addEmail = async () => {
    validateEmail(this.email);

    return this.addInfo('email');
  }

  getAnotherUser = async () => this.getUser.getUserByEmail(this.email);
}
