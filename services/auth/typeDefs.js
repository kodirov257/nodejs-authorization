import gql from 'graphql-tag';

export const typeDefs = gql`
    type User {
        id: Int
        username: String
        email: String
        phone: String
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
    }

    type Mutation {
        auth_register(username: String!, password: String!): String!
    }

    schema {
        query: Query
        mutation: Mutation
    }
`;

// module.exports = typeDefs