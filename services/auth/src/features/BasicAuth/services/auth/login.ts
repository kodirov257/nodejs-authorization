import { ContextModel, User } from '../../../../core/models';
import { GetUser } from '../hasura/get-user';
import { Generator } from './generator';

export class Login {
    protected generator;
    protected login: string;
    protected password: string;
    protected ctx: ContextModel;

    constructor(login: string, password: string, ctx: ContextModel) {
        this.generator = new Generator();
        this.login = login;
        this.password = password;
        this.ctx = ctx;
    }

    protected getUser = async () => {
        return (new GetUser()).getUserByCredentials(this.login, this.password);
    }

    public async signin () {
        const user: User = await this.getUser();

        return this.generator.generateTokens(user, this.ctx.req, this.ctx.res)
    }
}