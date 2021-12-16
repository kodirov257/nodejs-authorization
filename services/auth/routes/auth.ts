import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import gql from 'graphql-tag';

import {
    createUserSession,
    getUserByUsername,
    getCurrentUserId,
    isAuthenticated,
    getUserByEmail,
    getUserByPhone,
    getUserById,
    hasuraQuery,
} from '../services';
import { generateClaimsJwtToken, generateJwtRefreshToken } from '../helpers/auth-tool';
import { ValidationError } from 'apollo-server-express';
import { isEmail, isPhone } from '../validators';
import { ContextModel, User } from '../models';
import { UserFragment } from '../fragments';

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';

async function getUserByCredentials(username: string, password: string): Promise<User> {
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
        auth_me: async (_: void, args: any, ctx: ContextModel) => {
            if (!isAuthenticated(ctx.req)) {
                throw new Error('Authorization token has not provided')
            }

            try {
                const currentUserId = getCurrentUserId(ctx.req);

                return await getUserById(currentUserId);
            } catch (e: any) {
                throw new Error('Not logged in');
            }
        }
    },
    Mutation: {
        async auth_register (_: void, {username, email_or_phone, password}: {username: string, email_or_phone: string, password: string}) {
            let user: User|undefined = await getUserByUsername(username);

            if (user) {
                throw new Error('Username already registered');
            }

            if (isEmail(email_or_phone)) {
                user = await getUserByEmail(email_or_phone);
            } else if (isPhone(email_or_phone)) {
                user = await getUserByPhone(email_or_phone);
            } else {
                throw new ValidationError('Wrong email or phone is given.')
            }

            if (user) {
                throw new Error('Email or phone is already registered.')
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
                        email: isEmail(email_or_phone) ? email_or_phone : null,
                        phone: isPhone(email_or_phone) ? email_or_phone : null,
                        password: passwordHash,
                        secret_token: uuidv4(),
                        status: STATUS_ACTIVE,
                        role: ROLE_USER,
                    }
                }
            );

            return result.data?.insert_auth_users.returning !== undefined;
        },
        async auth_login (_: void, {username, email, phone, password}: {username: string, email: string, phone: string, password: string}, ctx: ContextModel) {
            const user: User = await getUserByCredentials(username, password);

            const ipAddress = (
                <string>(ctx.req.headers['x-forwarded-for'] || ctx.req.socket.remoteAddress || '')
            ).split(',')[0].trim();

            const {refreshToken, sessionId} = await createUserSession(user, ctx.req.headers['user-agent'], ipAddress);

            const accessToken = generateClaimsJwtToken(user, sessionId);

            return {
                access_token: accessToken,
                refresh_token: generateJwtRefreshToken({
                    token: refreshToken,
                }),
                user_id: user.id,
            };
        },
    }
};

export {
    resolvers,
};