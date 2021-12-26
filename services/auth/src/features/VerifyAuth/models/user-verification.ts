export interface UserVerification {
    user_id: string;
    email_verify_token: string;
    email_verified: boolean;
    phone_verify_token: string;
    phone_verify_token_expire: string;
    phone_verified: boolean;

}