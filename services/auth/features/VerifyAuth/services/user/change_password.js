import { ChangePassword as BasicChangePassword } from '../../../BasicAuth/services/user/change_password';

export class ChangePassword extends BasicChangePassword {

	constructor(oldPassword, newPassword, ctx) {
		super(oldPassword, newPassword, ctx);
	}
}
