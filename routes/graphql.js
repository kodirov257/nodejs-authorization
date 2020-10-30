let express = require('express');
let router = express.Router();
let { graphqlHTTP } = require('express-graphql');
let {buildSchema} = require('graphql');

// Construct a schema, using GraphQL schema language
let schema = buildSchema(`
  type Query {
    ip: String
  }
`);

const loggingMiddleware = (req, res, next) => {
  console.log('ip:', req.ip);
  next();
}

// The root provides a resolver function for each API endpoint
let root = {
  ip: function (args, request) {
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
