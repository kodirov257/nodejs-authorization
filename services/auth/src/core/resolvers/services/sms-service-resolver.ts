export interface ISmsServiceResolver {
    sendSmsVerifyToken(): Promise<boolean>;
}