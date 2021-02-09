import gql from 'graphql-tag';

export const UserFragment = gql`
    fragment User on auth_users {
        id
        username
        email
        phone
        role
        status
        password
        user_verifications {
            email_verify_token
            email_verified
            phone_verify_token
            phone_verify_token_expire
            phone_verified
        }
        user_networks {
            network
            identity
        }
    }
`;
