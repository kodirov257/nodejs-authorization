import { ChangePassword as BasicChangePassword } from '../../../BasicAuth/services/user/change_password';
import * as constants from "../../../../core/helpers/values";

export class ChangePassword extends BasicChangePassword {

	constructor(oldPassword, newPassword, ctx) {
		super(oldPassword, newPassword, ctx);
	}

	async getUser() {
		const user = await super.getUser();

		if (user.status !== constants.STATUS_ACTIVE) {
			throw new Error('User not activated.');
		}

		return user;
	}
}
