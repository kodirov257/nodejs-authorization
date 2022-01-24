export interface AddEmailServiceResolver<TUser> {
    addEmail(): Promise<TUser>;
}