export interface AddPhoneServiceResolver<TUser> {
    addPhone(): Promise<TUser>;
}