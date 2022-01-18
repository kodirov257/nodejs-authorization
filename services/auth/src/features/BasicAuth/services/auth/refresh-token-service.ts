import JWT from 'jsonwebtoken';
import moment from 'moment';
import lodash from 'lodash';
const { get } = lodash;

import { ContextModel, GeneratorModel, User } from '../../../../core/models';
import { getUserById, getUserSession } from '../../../../core/repositories';
import { RefreshTokenServiceResolver } from '../../../../core/resolvers';
import { GeneratorService } from './generator-service';

export class RefreshTokenService implements RefreshTokenServiceResolver {
    private readonly generator: GeneratorService;
    private readonly token: string;
    private readonly ctx: ContextModel;

    constructor(token:string, ctx: ContextModel) {
        this.generator = new GeneratorService();
        this.ctx = ctx;
        this.token = token;
    }

    public async refreshToken(): Promise<GeneratorModel> {
        const refreshToken: string = this.getRefreshToken(this.token);
        const userSession = await getUserSession(refreshToken);
        if (!userSession) {
            throw new Error('Session is not found.');
        }

        const expireData = moment(userSession.expires_at);
        if (!expireData.isAfter()) {
            throw new Error('Session is expired.');
        }

        const user = await getUserById<User>(userSession.user_id);
        if (!user) {
            throw new Error('User is not found.');
        }

        return this.generator.generateTokens(user, this.ctx.req, this.ctx.res);
    }

    private getRefreshToken = (refreshToken: string): string => {
        return this.getFieldFromRefreshToken(refreshToken, 'token');
    }

    private getFieldFromRefreshToken = (refreshToken: string, field: string): string => {
        const verifiedToken: JWT.JwtPayload|string = this.getDataFromRefreshToken(refreshToken);

        return get(verifiedToken, `${field}`) as string;
    }

    private getDataFromRefreshToken = (refreshToken: string): JWT.JwtPayload|string => {
        return JWT.verify(refreshToken, process.env.JWT_PRIVATE_KEY!);
    }
}