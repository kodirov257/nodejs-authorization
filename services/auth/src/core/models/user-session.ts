export interface UserSession {
    id: string;
    user_id: string;
    expires_at: string;
    refresh_token: string;
    user_agent: string;
    ip_address: string;
    created_at: string;
    updated_at: string;
}