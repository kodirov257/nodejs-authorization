import {print} from 'graphql/language/printer';
import lodash from 'lodash';
import {v4 as uuidv4} from 'uuid';
import {ASTNode} from 'graphql';
import fetch, {Response} from 'node-fetch';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

const { get } = lodash;

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';

const adminSecret: string = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const endpoint: string = process.env.HASURA_GRAPHQL_ENDPOINT!;

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

interface User {
    id: number;
    username: string;
    email: string;
    phone: string;
    password: string;
    status: number;
    secret_token: string;
    created_at: string;
    updated_at: string;
    last_seen_at: string;
}

type JSONResponse<T> = {
    data?: T,
    errors?: Array<{message: string}>,
}

async function hasuraQuery<T>(document: ASTNode, variables: any): Promise<JSONResponse<T>> {
    const response: Response = await fetch('http://graphql-engine:8080/v1/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-hasura-admin-secret': adminSecret
        },
        body: JSON.stringify({
            query: print(document),
            variables,
        })
    });

    return await response.json() as JSONResponse<T>;
}

async function getUserByUsername(username: string): Promise<User|undefined> {
    console.log('getUserByUsername Before');
    const response = await hasuraQuery<{auth_users: User[]}>(
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
    try {
        console.log('getUserByUsername After');

        console.log(response);
        console.log(response.data?.auth_users);
        console.log(response.data?.auth_users ?? null);
        console.log(get(response, 'data.auth_users'));

        return response.data?.auth_users[0] ?? undefined;
    } catch (e: any) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}

async function getUserByCredentials(username: string, password: string) {
    const user: User|undefined = await getUserByUsername(username);

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
        async auth_register (_: void, {username, email, phone, password}: {username: string, email: string, phone: string, password: string}) {
            const user: User|undefined = await getUserByUsername(email);

            if (user) {
                throw new Error('Email already registered');
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const result = await hasuraQuery<{insert_auth_users: { returning : User[] }}>(
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
                        role: ROLE_USER,
                    }
                }
            );

            // console.log('auth_register: After');
            // console.log(result.data?.insert_auth_users.returning);

            return result.data?.insert_auth_users.returning !== undefined;
        },
        // async auth_login (_: void, {username, email, phone, password}: {username: string, email: string, phone: string, password: string}) {
        //     const user = getUserByCredentials(username, password);
        // },
    }
};

export {
    resolvers,
};