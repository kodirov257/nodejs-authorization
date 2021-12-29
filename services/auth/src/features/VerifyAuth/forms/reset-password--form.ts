export interface ResetPasswordForm {
    emailFields?: {
        email_verify_token: string|null,
    };
    phoneFields?: {
        phone_verify_token: string|null,
        phone_verify_token_expire: string|null,
    };
}