import { GetUser, Signin as BasicLogin } from '..';

export class Signin extends BasicLogin {
	constructor(usernameEmailOrPhone, password, ctx) {
		super(usernameEmailOrPhone, password, ctx);
	}

	singin = async (usernameEmailOrPhone, password, ctx) => {
		const user = await (new GetUser()).getUserByCredentials(usernameEmailOrPhone, password);

		return this.generateTokens(user, ctx.req);
	}
}
