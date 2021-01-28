import { GetUser } from '../hasura/get-user';
import { Generator } from './generator';

export class Signin {
	generator;
	usernameEmailOrPhone;
	password;
	ctx;

	constructor(usernameEmailOrPhone, password, ctx) {
		this.generator = new Generator();
		this.usernameEmailOrPhone = usernameEmailOrPhone;
		this.password = password;
		this.ctx = ctx;
	}

	async signin() {
		const user = await this.getUser();
		// await this.generator.removeUserSession(user.id);

		return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
	}

	getUser = async () => {
		return (new GetUser()).getUserByCredentials(this.usernameEmailOrPhone, this.password);
	}
}
