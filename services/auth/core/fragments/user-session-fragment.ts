import gql from 'graphql-tag';

export const UserSessionFragment = gql`
    fragment UserSession on auth_user_sessions {
        id
        user_id
        refresh_token
        expires_at
        ip_address
        user_agent
    }
`;