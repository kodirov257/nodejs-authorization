import { validateEmail, validateVerifyEmail } from '../../validators';
import { AddInfo } from './add_info';
import { Mail } from '../mail';

export class AddEmail extends AddInfo {
	constructor({email = null, token = null, ctx}) {
		super({email, token, ctx});
		this.mailService = Mail;
	}

	sendEmailAddEmailToken = async () => {
		validateEmail(this.email);

		return this.sendAddInfoToken('email');
	}

	addEmail = async () => {
		const value = validateVerifyEmail(this.token);
		this.token = value.token;

		return this.addInfo('email');
	}

	validateAdd = (verification) => {
		if (verification.email_verify_token !== this.token) {
			throw new Error('Provided token is not equal to the current user.');
		}
	}

	getUserByToken = async () =>  this.getUser.getUserByEmailVerifyToken(this.token);

	getAnotherUser = async () => this.getUser.getUserByEmail(this.email);
}
