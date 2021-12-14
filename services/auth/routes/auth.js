import { print } from 'graphql/language/printer';
import { get, memoize } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

const userFragment = gql`
    fragment User on auth_users {
        id
        username
        email
        phone
        password
        status
        secret_token
        created_at
        updated_at
        last_seen_at
    }
`;

async function hasuraQuery(document, variables) {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-hasura-admin-secret': adminSecret
        },
        body: JSON.stringify({
            query: print(document),
            variables,
        })
    });

    return response.json();
}

async function getUserByUsername(username) {
    try {
        const response = await hasuraQuery(
            gql`
                ${userFragment}
                query($where: auth_users_bool_exp) {
                    auth_users(where: $where) {
                        ...User
                    }
                }
            `,
            {
                where: {
                    username: { _eq: username },
                },
            },
        );

        // console.log(response);
        // console.log(response.data.users);
        // console.log(get(response, 'data.users'));

        return get(response, 'data.users[0]');
    } catch (e) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}

async function getUserByCredentials(username, password) {
    const user = getUserByUsername(username);

    if (!user) {
        throw new Error('Invalid "email" or "password"');
    }

    if (user.status !== STATUS_ACTIVE) {
        throw new Error('User not activated.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
        throw new Error('Invalid "email" or "password"');
    }

    return user;
}

// Provide resolver functions for your schema fields
const resolvers = {
    Query: {
        hello: () => 'Hello world !',
    },
    Mutation: {
        async auth_register (_, {username, email, phone, password}) {
            const user = await getUserByUsername(email);

            if (user) {
                // console.log(user);
                throw new Error('Email already registered');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await hasuraQuery(
                gql`
                    ${userFragment}
                    mutation ($user: auth_users_insert_input!) {
                        insert_auth_users(objects: [$user]) {
                            returning {
                                ...User
                            }
                        }
                    }
                `,
                {
                    user: {
                        username: username,
                        password: passwordHash,
                        secret_token: uuidv4(),
                        status: STATUS_ACTIVE,
                    }
                }
            );

            // console.log(result.data.insert_users.returning);
            return get(result, 'data.insert_users.returning') !== undefined;
        },
        async auth_login (_, {username, email, phone, password}) {
            const user = getUserByCredentials(username, password);
        },
    }
};

export {
    resolvers,
};