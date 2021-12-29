import { GeneratorModel } from '../../models';

export interface IResetPasswordServiceResolver {
    sendResetEmail(email: string): Promise<boolean>;
    sendResetPhone(phone: string): Promise<boolean>;
    resetViaEmail(token: string, password: string): Promise<GeneratorModel|boolean>;
    resetViaPhone(phone: string, token: string, password: string): Promise<GeneratorModel|boolean>;

}