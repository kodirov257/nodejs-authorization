import { BasicAuth } from '../BasicAuth/resolvers';
import {
	Register,
	Verify,
	Signin,
	Resend,
	ResetPassword,
	ChangePassword,
	AddEmail,
	AddPhone,
} from './services';

export class VerifyAuth extends BasicAuth {
	registerService;
	verifyService;
	signinService;
	resendService;
	resetService;
	changePasswordService;
	addEmailService;
	addPhoneService;

	constructor() {
		super();

		this.registerService = Register;
		this.verifyService = Verify;
		this.signinService = Signin;
		this.resendService = Resend;
		this.resetService = ResetPassword;
		this.addEmailService = AddEmail;
		this.addPhoneService = AddPhone;
		this.changePasswordService = ChangePassword;
	}

	register = async (_, {login, password}) => {
		return (new this.registerService(login, password)).register();
	}

	verify_email = async (_, {token}, ctx) => {
		return (new this.verifyService({token, ctx})).verifyEmail();
	}

	verify_phone = async (_, {phone, token}, ctx) => {
		return (new this.verifyService({phone, token, ctx})).verifyPhone();
	}

	signin = async (_, {login, password}, ctx) => {
		return (new this.signinService(login, password, ctx)).signin();
	}

	resend_email = async (_, {email}) => {
		return (new this.resendService({email})).resendEmail();
	}

	resend_phone = async (_, {phone}) => {
		return (new this.resendService({phone})).resendPhone();
	}

	send_reset_email = async (_, {email}) => {
		return (new this.resetService({email})).sendResetEmail();
	}

	send_reset_phone = async (_, {phone}) => {
		return (new this.resetService({phone})).sendResetPhone();
	}

	reset_via_email = async (_, {token, password}) => {
		return (new this.resetService({token, password})).resetViaEmail();
	}

	reset_via_phone = async (_, {phone, token, password}) => {
		return (new this.resetService({phone, token, password})).resetViaPhone();
	}

	change_password = async (_, {old_password, new_password}, ctx) => {
		return (new this.changePasswordService({old_password, new_password, ctx})).changePassword();
	}

	add_email = async (_, {email}, ctx) => {
		return (new this.addEmailService({email, ctx})).sendEmailAddEmailToken();
	}

	verify_add_email = async (_, {token}, ctx) => {
		return (new this.addEmailService({token, ctx})).verifyAddEmail();
	}

	add_phone = async (_, {phone}, ctx) => {
		return (new this.addPhoneService({phone, ctx})).sendAddPhoneToken();
	}

	verify_add_phone = async (_, {phone, token}, ctx) => {
		return (new this.addPhoneService({phone, token, ctx})).verifyAddPhone();
	}

	resolvers() {
		return {
			Query: {
				hello: () => super.hello(),
				auth_me: async () => super.auth_me(),
				abilities: (_, args, ctx) => this.abilities(),
				ability_values: (_, {type}, ctx) => this.ability_values(type),
			},
			Mutation: {
				register: async (_, {login, password}) =>
					this.register(_, {login, password}),
				verify_email: async (_, {token}, ctx) =>
					this.verify_email(_, {token}, ctx),
				verify_phone: async (_, {phone, token}, ctx) =>
					this.verify_phone(_, {phone, token}, ctx),
				signin: async (_, {login, password}, ctx) =>
					this.signin(_, {login, password}, ctx),
				change_password: async (_, {old_password, new_password}, ctx) =>
					this.change_password(_, {old_password, new_password}, ctx),
				refresh_token: async (_, args, ctx) =>
					this.refresh_token(_, ctx),
				resend_email: async (_, {email}) =>
					this.resend_email(_, {email}),
				resend_phone: async (_, {phone}) =>
					this.resend_phone(_, {phone}),
				send_reset_email: async (_, {email}) =>
					this.send_reset_email(_, {email}),
				send_reset_phone: async (_, {phone}) =>
					this.send_reset_phone(_, {phone}),
				reset_via_email: async (_, {token, password}) =>
					this.reset_via_email(_, {token, password}),
				reset_via_phone: async (_, {phone, token, password}) =>
					this.reset_via_phone(_, {phone, token, password}),
				add_email: async (_, {email}, ctx) =>
					this.add_email(_, {email}, ctx),
				verify_add_email: async (_, {token}, ctx) =>
					this.verify_add_email(_, {token}, ctx),
				add_phone: async (_, {phone}, ctx) =>
					this.add_phone(_, {phone}, ctx),
				verify_add_phone: async (_, {phone, token}, ctx) =>
					this.verify_add_phone(_, {phone, token}, ctx),
			},
		};
	}
}
