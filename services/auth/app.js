import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import { typeDefs } from './typeDefs';
import { memoize } from 'lodash';
import get from 'lodash/get';
import fetch from 'node-fetch';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
require('custom-env').env();
// let authController = require('controllers/auth');

const STATUS_INACTIVE = 1;
const STATUS_ACTIVE = 5;

const userFragment = gql`
  fragment User on users {
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

const getDefaultHeaders = memoize(() => {
  const adminSecret = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!adminSecret) {
    throw Error(
        'The environment "HASURA_GRAPHQL_ADMIN_SECRET" has not provided',
    );
  }
  return Object.freeze({
    [`${process.env.HASURA_GRAPHQL_HEADER_PREFIX}admin-secret`]: adminSecret,
  });
});

async function hasuraQuery(document, variables) {
  const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-hasura-admin-secret': 'losandijoncity!@$@'
      // ...getDefaultHeaders(),      // TODO: fix environments
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
          query($where: users_bool_exp) {
            users(where: $where) {
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
            mutation ($user: users_insert_input!) {
              insert_users(objects: [$user]) {
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

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

// const port = process.env.PORT;
// app.listen({ port: port }, () =>
//     console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
// );

module.exports = app;