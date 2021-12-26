import { ContextModel, GeneratorModel } from '../../models';
import { ILoginServiceResolver } from '../../resolvers';

export abstract class BasicLoginService<TUser, TGeneratorService> implements ILoginServiceResolver {
    protected generator: TGeneratorService;
    protected login: string;
    protected password: string;
    protected ctx: ContextModel;

    protected constructor(login: string, password: string, generatorService: TGeneratorService, ctx: ContextModel) {
        this.login = login;
        this.password = password;
        this.ctx = ctx;
        this.generator = generatorService;
    }

    protected abstract getUser(): Promise<TUser>;
    protected abstract getGeneratedToken(user: TUser): Promise<GeneratorModel>;

    public async signin (): Promise<GeneratorModel> {
        const user: TUser = await this.getUser();

        return this.getGeneratedToken(user);
    }
}