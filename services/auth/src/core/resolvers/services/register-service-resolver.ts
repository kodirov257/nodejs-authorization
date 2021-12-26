export interface IRegisterServiceResolver<TUser> {
    register(): Promise<TUser>;
}