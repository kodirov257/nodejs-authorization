import { GeneratorModel } from '../../models';

export interface ILoginServiceResolver {
    signin(): Promise<GeneratorModel>;
}