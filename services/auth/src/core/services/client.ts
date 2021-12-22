import { print } from 'graphql/language/printer';
import fetch, { Response } from 'node-fetch';
import { ASTNode } from 'graphql';

import { JSONResponse } from '../models';

const adminSecret: string = process.env.HASURA_GRAPHQL_ADMIN_SECRET!;
const endpoint: string = process.env.HASURA_GRAPHQL_ENDPOINT!;

export async function hasuraQuery<T>(document: ASTNode, variables: any): Promise<JSONResponse<T>> {
    const response: Response = await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'x-hasura-admin-secret': adminSecret,
        },
        body: JSON.stringify({
            query: print(document),
            variables,
        })
    });

    return await response.json() as JSONResponse<T>;
}