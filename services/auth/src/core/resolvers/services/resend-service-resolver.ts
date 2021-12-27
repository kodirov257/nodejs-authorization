export interface IResendServiceResolver {
    resendBoth(): Promise<boolean>;
    resendEmail(): Promise<boolean>;
    resendPhone(): Promise<boolean>;
}