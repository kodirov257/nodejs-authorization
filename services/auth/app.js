const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const gql = require('graphql-tag');
require('custom-env').env();

// Construct a schema, using GraphQL schema language
const typeDefs = gql`
  type Query {
    hello: String
  }
`;




// Provide resolver functions for your schema fields
const resolvers = {
  Query: {
    hello: () => 'Hello worlddddd21321!',
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const app = express();
server.applyMiddleware({ app });

// const port = process.env.PORT;
// app.listen({ port: port }, () =>
//     console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`)
// );

module.exports = app;