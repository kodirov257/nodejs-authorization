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
        secret_token
        created_at
        updated_at
        last_seen_at
    }
`;