import { VerifyAuth } from '../VerifyAuth/resolvers';
import { Facebook, Google } from './services';

export class NetworkAuth extends VerifyAuth {
  googleService;
  facebookService;

  constructor() {
    super();

    this.googleService = new Google();
    this.facebookService = new Facebook();
  }

  auth_by_google = async (token) => {
    return this.googleService.authorize(token);
  }

  auth_by_facebook = async (token) => {
    return this.facebookService.authorize(token);
  }

  resolvers() {
    return {
      Query: {
        hello: () => super.hello(),
        auth_me: async () => super.auth_me(),
      },
      Mutation: {
        register: async (_, {username, email_or_phone, password}) =>
          this.register(_, {username, email_or_phone, password}),
        verify_email: async (_, {token}, ctx) =>
          this.verify_email(_, {token}, ctx),
        verify_phone: async (_, {phone, token}, ctx) =>
          this.verify_phone(_, {phone, token}, ctx),
        signin: async (_, {login, password}, ctx) =>
          this.signin(_, {login, password}, ctx),
        change_password: async (_, {old_password, new_password}, ctx) =>
          this.change_password(_, {old_password, new_password}, ctx),
        refresh_token: async (_, {refresh_token}, ctx) =>
          this.refresh_token(_, {refresh_token}, ctx),
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
        send_add_email_token: async (_, {email}, ctx) =>
          this.send_add_email_token(_, {email}, ctx),
        add_email: async (_, {token}, ctx) =>
          this.add_email(_, {token}, ctx),
        send_add_phone_token: async (_, {phone}, ctx) =>
          this.send_add_phone_token(_, {phone}, ctx),
        add_phone: async (_, {phone, token}, ctx) =>
          this.add_phone(_, {phone, token}, ctx),
        auth_by_google: async (_, {token}, ctx) =>
          this.auth_by_google(token),
        auth_by_facebook: async (_, {token}, ctx) =>
          this.auth_by_facebook(token),
      },
    };
  }
}
