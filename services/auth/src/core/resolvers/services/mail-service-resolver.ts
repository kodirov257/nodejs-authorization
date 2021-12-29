export interface IMailServiceResolver {
    sendEmailVerifyToken(): Promise<boolean>;
    sendEmailResetToken(): Promise<boolean>;
}