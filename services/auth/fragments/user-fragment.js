import gql from "graphql-tag";

export const UserFragment = gql`
    fragment User on users {
        id
        username
        email
        phone
        role
        status
        password
    }
`;