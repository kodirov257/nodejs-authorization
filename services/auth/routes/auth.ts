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
import { isEmail, isPhone, validateRegistration } from '../validators';
import { ValidationError } from 'apollo-server-express';
import { ContextModel, User } from '../models';
import { UserFragment } from '../fragments';

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const ROLE_USER = 'user';
const ROLE_ADMIN = 'admin';

async function getUserByCredentials(usernameEmailOrPhone: string, password: string): Promise<User> {
    let user: User|undefined;
    if (isEmail(usernameEmailOrPhone)) {
        user = await getUserByEmail(usernameEmailOrPhone);
    } else if (isPhone(usernameEmailOrPhone)) {
        user = await getUserByPhone(usernameEmailOrPhone);
    } else {
        user = await getUserByUsername(usernameEmailOrPhone);
    }

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
            const value: {username: string, email_or_phone: string, password: string}
                = validateRegistration(username, email_or_phone, password);

            let user: User|undefined = await getUserByUsername(value.username);

            if (user) {
                throw new Error('Username already registered');
            }

            if (isEmail(value.email_or_phone)) {
                user = await getUserByEmail(value.email_or_phone);
            } else if (isPhone(value.email_or_phone)) {
                user = await getUserByPhone(value.email_or_phone);
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
                        username: username.replace(/ /g, ''),
                        email: isEmail(value.email_or_phone) ? value.email_or_phone : null,
                        phone: isPhone(value.email_or_phone) ? value.email_or_phone : null,
                        password: passwordHash,
                        secret_token: uuidv4(),
                        status: STATUS_ACTIVE,
                        role: ROLE_USER,
                    }
                }
            );

            return result.data?.insert_auth_users.returning !== undefined;
        },
        async auth_login (_: void, {username_email_or_phone, password}: {username_email_or_phone: string, password: string}, ctx: ContextModel) {
            const user: User = await getUserByCredentials(username_email_or_phone, password);

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