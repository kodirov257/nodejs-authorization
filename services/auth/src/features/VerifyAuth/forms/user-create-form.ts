export interface UserCreateForm {
    username: string;
    email?: string | null;
    phone?: string | null;
    password: string;
    role: string;
    secret_token: string;
    status: number;
    user_verifications: {
        data: [UserCreateVerificationForm];
    };
}

export interface UserCreateVerificationForm {
    email_verify_token?: string;
    phone_verify_token?: string;
    phone_verify_token_expire?: string;
}