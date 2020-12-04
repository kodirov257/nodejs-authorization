import gql from 'graphql-tag';

export const typeDefs = gql`
    type AuthPayload {
        access_token: String!
        refresh_token: String!
        user_id: ID!
    }
    
    type User {
        id: Int
        username: String
        email: String
        phone: String
        role: String
        password: String
        status: Int
        secret_token: String
        created_at: String
        updated_at: String
        last_seen_at: String
    }

    type Profile {
        user_id: User!
        first_name: String
        middle_name: String
        last_name: String
        date_of_birth: String
        gender: Int
        biography: String
        avatar: String
    }

    type Query {
        hello: String
        auth_me: User
    }

    type Mutation {
        login(username_email_or_phone: String!, password: String!): AuthPayload
        register(username: String!, email_or_phone: String!, password: String!): Boolean
        verify_email(token: String!): Boolean
        verify_phone(phone: String!, token: String!): Boolean
        resend_email(email: String!): Boolean
        resend_phone(phone: String!): Boolean
        send_reset_email(email: String!): Boolean
        send_reset_phone(phone: String!): Boolean
        reset_via_email(token: String!, password: String!): Boolean
        reset_via_phone(phone: String!, token: String!, password: String!): Boolean
        change_password(old_password: String!, new_password: String!): Boolean
        refresh_token: AuthPayload
    }

    schema {
        query: Query
        mutation: Mutation
    }
`;

// module.exports = typeDefs