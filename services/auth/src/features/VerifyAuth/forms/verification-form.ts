export interface VerificationForm {
    emailFields?: {
        email_verify_token: string|null,
        email_verified: boolean,
    };
    phoneFields?: {
        phone_verify_token: string|null,
        phone_verify_token_expire: string|null,
        phone_verified: boolean,
    };
}