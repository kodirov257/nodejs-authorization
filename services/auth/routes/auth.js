let express = require('express');
let router = express.Router();
let { graphqlHTTP } = require('express-graphql');
let { buildSchema } = require('graphql');

let auth = require('../controllers/auth');
let types = require('../typeDefs');

// Construct a schema, using GraphQL schema language
// let schema = buildSchema(types);
let schema = buildSchema(`
  type AuthPayload {
    accessToken: String!
    refreshToken: String!
    userId: ID!
  }
  
  type Role {
    id: ID!
    name: String!
    created_at: String!
  }
  
  type User {
    id: ID!
    username: String!
    email: String!
    phone: String!
    status: Int!
    role: Role!
    created_at: String!
  }
  
  type Mutation {
    auth_register(email: String, username: String, phone: String, password: String!): Boolean
    auth_login(email: String, username: String, phone: String, password: String!): AuthPayload
    auth_change_password(id: ID!, new_password: String!): Boolean
    auth_activate_account(email: String!, secret_token: String!): Boolean
    auth_refresh_token: AuthPayload
  }
  
  type Query {
    auth_me: String!
  }
  
  schema {
    query: Query
    mutation: Mutation
  }
`);

const loggingMiddleware = (req, res, next) => {
    console.log('ip:', req.ip);
    next();
}

// The root provides a resolver function for each API endpoint
let root = {
    auth_me: function (args, request) {
        return request.ip;
    }
};

/* Graphql page. */
router.use(loggingMiddleware);
router.use('/', graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
}));

module.exports = router;