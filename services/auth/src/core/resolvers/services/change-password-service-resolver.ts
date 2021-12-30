export interface IChangePasswordServiceResolver<TUser> {
    changePassword(): Promise<TUser>;
}