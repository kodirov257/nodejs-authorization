import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import gql from 'graphql-tag';
import { print } from 'graphql/language/printer';
import { typeDefs } from './typeDefs';
import { memoize } from 'lodash';
import fetch from 'node-fetch';
require('custom-env').env();
// let authController = require('controllers/auth');

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
      ...getDefaultHeaders(),
    },
    body: JSON.stringify({
      query: print(document),
      variables,
    })
  });

  return response.json();
}

async function getUserByEmail(username) {
  try {
    // const response = await hasuraQuery(
    return await hasuraQuery(
        gql`
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
          query($where: user_bool_exp) {
            user(where: $where) {
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

    // return getIn
  } catch (e) {
    // throw new Error('Unable to find the email');
    throw new Error(e.message);
  }
}

// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => 'Hello world !',
  },
  Mutation: {
    async auth_register (_, {username, email, phone, password}) {
      // const user = getUserByEmail(email);
      return getUserByEmail(username);
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