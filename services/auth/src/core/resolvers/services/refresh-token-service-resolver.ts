import { GeneratorModel } from '../../models';

export interface RefreshTokenServiceResolver {
    refreshToken(): Promise<GeneratorModel>;
}