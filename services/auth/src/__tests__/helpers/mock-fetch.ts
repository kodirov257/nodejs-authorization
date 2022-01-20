import fetch from 'node-fetch';

export async function mockFetch<T>(body: string): Promise<T> {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT!, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: body,
    });

    return await response.json() as T;
}