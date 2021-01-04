import { GetUser } from '..';
import { Signin as BasicLogin } from '../../../BasicAuth/services/auth/login';

export class Signin extends BasicLogin {
	constructor(usernameEmailOrPhone, password, ctx) {
		super(usernameEmailOrPhone, password, ctx);
	}

	signin = async () => {
		const user = await (new GetUser()).getUserByCredentials(this.usernameEmailOrPhone, this.password);

		return this.generateTokens(user, this.ctx.req);
	}
}
