import { ContextModel, GeneratorModel, User } from '../../../../core/models';
import { ILoginServiceResolver } from '../../../../core/resolvers';
import { BasicLoginService } from '../../../../core/abstracts';
import { UserGetRepository } from '../../repositories';
import { GeneratorService } from './generator-service';

export class LoginService extends BasicLoginService<User, GeneratorService> implements ILoginServiceResolver {
    constructor(login: string, password: string, ctx: ContextModel) {
        super(login, password, new GeneratorService(), ctx);
    }

    protected getUser = async (): Promise<User> => {
        return (new UserGetRepository()).getUserByCredentials(this.login, this.password);
    }

    protected getGeneratedToken(user: User): Promise<GeneratorModel> {
        return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
    }

    public override async signin (): Promise<GeneratorModel> {
        const user: User = await this.getUser();

        return this.getGeneratedToken(user);
    }
}