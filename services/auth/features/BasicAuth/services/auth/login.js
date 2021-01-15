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

	signin = async () => {
		const user = await (new GetUser()).getUserByCredentials(this.usernameEmailOrPhone, this.password);

		return this.generator.generateTokens(user, this.ctx.req);
	}
}
