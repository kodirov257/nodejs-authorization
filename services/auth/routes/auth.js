let express = require('express');
let router = express.Router();
let { graphqlHTTP } = require('express-graphql');
let { buildSchema } = require('graphql');
const { ApolloServer } = require('apollo-server-express');
// let typeDefs = require('../typeDefs');

let auth = require('../controllers/auth');

// const loggingMiddleware = (req, res, next) => {
//     console.log('ip:', req.ip);
//     next();
// }

const resolvers = {
    Query: {
        auth_me: function (_, args, context, info) {
            console.log(context.myProperty);
            return context.ip;
        },
        context: async ({ req }) => {
            return {
                myProperty: true
            };
        },
    },
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ res, req }) => ({ res, req }),
});
const app = express();
server.applyMiddleware({
    app,
    path: '/graphql',
});


app.listen({port: process.env.PORT}, () => {
    console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`);
});

module.exports = router;