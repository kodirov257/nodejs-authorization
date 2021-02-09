import { GetUser } from '..';
import { Signin as BasicLogin } from '../../../BasicAuth/services/auth/login';

export class Signin extends BasicLogin {
	constructor(usernameEmailOrPhone, password, ctx) {
		super(usernameEmailOrPhone, password, ctx);
	}

	getUser = async () => {
		return (new GetUser()).getUserByCredentials(this.usernameEmailOrPhone, this.password);
	}
}
