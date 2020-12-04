import gql from "graphql-tag";

export const UserRegistrationFragment = gql`
    fragment User on users {
        id
        username
        email
        phone
        role
        status
        email_verify_token
        email_verified
        phone_verify_token
        phone_verify_token_expire
        phone_verified
    }
`;