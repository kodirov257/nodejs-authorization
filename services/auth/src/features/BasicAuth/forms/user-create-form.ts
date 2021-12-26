export interface UserCreateForm {
    username: string;
    email?: string | null;
    phone?: string | null;
    password: string;
    role: string;
    secret_token: string;
    status: number;
}