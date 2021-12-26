export interface IMailServiceResolver {
    sendEmailVerifyToken(): Promise<boolean>;
}