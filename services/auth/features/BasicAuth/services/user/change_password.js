import bcrypt from 'bcryptjs';

import { isAuthenticated, getCurrentUserId } from '../../../../core/helpers/user';
import { validateChangePassword } from '../../../../core/validators';
import { getUserById } from '../hasura/get-user-by-id';
import { updateUser } from '../hasura/update-user';

export class ChangePassword {
	oldPassword;
	newPassword;
	ctx;

	constructor(oldPassword, newPassword, ctx) {
		this.oldPassword = oldPassword;
		this.newPassword = newPassword;
		this.ctx = ctx;
	}

	async changePassword() {
		const user = await this.getUser();

		return this.change(user);
	}

	async getUser() {
		if (!isAuthenticated(this.ctx.req)) {
			throw new Error('Authorization token has not provided');
		}

		const currentUserId = getCurrentUserId(this.ctx.req);
		const user = await getUserById(currentUserId);

		if (!user) {
			throw new Error('User not found.');
		}

		return user;
	}

	async change(user) {
		validateChangePassword(this.oldPassword, this.newPassword);

		const passwordMatch = await bcrypt.compare(this.oldPassword, user.password);

		if (!passwordMatch) {
			throw new Error('Invalid "password".');
		}

		const passwordHash = await bcrypt.hash(this.newPassword, 10);
		const fields = {
			password: passwordHash,
		};

		const result = await updateUser(user.id, fields);
		if (!result) {
			throw new Error('Password is not changed.');
		}

		return true;
	}
}
