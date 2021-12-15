import { print } from 'graphql/language/printer';
import fetch, {Response} from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { ASTNode } from 'graphql';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

import { UserFragment } from '../fragments';

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';

const adminSecret: string = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const endpoint: string = process.env.HASURA_GRAPHQL_ENDPOINT!;

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
    const response: Response = await fetch(endpoint, {
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
    try {
        const response = await hasuraQuery<{auth_users: User[]}>(
            gql`
                ${UserFragment}
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
                    ${UserFragment}
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