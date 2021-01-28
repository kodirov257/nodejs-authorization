import gql from 'graphql-tag';

export const typeDefs = gql`
	type AuthPayload {
		access_token: String!
		refresh_token: String!
		expires_in: Int!
		user_id: ID!
	}

	type RefreshPayload {
		access_token: String!
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

	type Query {
		hello: String
		auth_me: User
	}

	type Mutation {
		signin(login: String!, password: String!): AuthPayload
		register(login: String!, password: String!): Boolean
		change_password(old_password: String!, new_password: String!): Boolean
		refresh_token(refresh_token: String!): RefreshPayload
		add_email(email: String!): Boolean
		add_phone(phone: String!): Boolean
	}

	schema {
		query: Query
		mutation: Mutation
	}
`;

// module.exports = typeDefs
