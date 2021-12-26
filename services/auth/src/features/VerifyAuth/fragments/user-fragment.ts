import { DocumentNode } from 'graphql';
import gql from 'graphql-tag';

export const UserFragment: DocumentNode = gql`
    fragment User on auth_users {
        id
        username
        email
        phone
        password
        status
        role
        user_verifications {
            email_verify_token
            email_verified
            phone_verify_token
            phone_verify_token_expire
            phone_verified
        }
    }
`;