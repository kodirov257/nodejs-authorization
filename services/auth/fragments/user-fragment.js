import gql from "graphql-tag";

export const UserFragment = gql`
    fragment User on users {
        id
        username
        email
        phone
        password
        role
        status
        secret_token
        created_at
        updated_at
        last_seen_at
    }
`;