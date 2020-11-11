import { memoize } from "lodash";
import fetch from "node-fetch";
import { print } from "graphql/language/printer";
require('custom-env').env();

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

export const hasuraQuery = async (document, variables) => {
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