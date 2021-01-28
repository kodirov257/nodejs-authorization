'use strict';
const { print } = require('graphql/language/printer');
const forEach = require('../sum');
const fetch = require('node-fetch');
const gql = require('graphql-tag');
const dotEnvFlow = require('dotenv-flow');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envConfig = dotEnv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.test')));
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');



// test('adds 1 + 2 to equal 3', () => {
//     const mockCallback = jest.fn(x => 42 + x);
//     forEach([0, 1], mockCallback);
//     expect(mockCallback.mock.calls.length).toBe(2);
//     expect(mockCallback.mock.calls[0][0]).toBe(0);
//     expect(mockCallback.mock.calls[1][0]).toBe(1);
//     expect(mockCallback.mock.results[0].value).toBe(42);
// });

const data = [
    {
        id: 1,
        username: 'admin',
        email: null,
        phone: null,
    },
];

const serverResponse = {
    data: {
        users: [
            {
                id: 1,
                username: 'admin',
                email: null,
                phone: null,
            },
        ],
    },
};

test('createUser calls fetch with the right args and returns the user id', async () => {

    fetch.mockReturnValue(
        Promise.resolve(new Response(JSON.stringify(serverResponse))),
    );

    const USER_QUERY = gql`
        query($id: bigint!) {
            users(id: $id) {
                id
                username
                email
                phone
            }
        }
    `;

    const response = await mockFetch(USER_QUERY, { id: 2 });
    // console.log(response.data.users);

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        body: JSON.stringify({
            query: print(USER_QUERY),
            variables: { id: 2 },
        }),
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'x-hasura-admin-secret': 'masterkey',
        },
    });

    expect(response).toEqual(serverResponse);
});

async function mockFetch(document, variables) {
    // const result = await jest.fn(url => {
    //     if (variables.id === 1) {
    //         return Promise.resolve({
    //             data: {
    //                 users: data[0],
    //             },
    //         });
    //     }
    // });
    //
    // console.log(result);

    // if (variables.id === 1) {
    //     return Promise.resolve({
    //         data: {
    //             users: [
    //                 data[0]
    //             ],
    //         },
    //     });
    // }
    //
    // throw new Error('Mock Error code 404');

    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-hasura-admin-secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET
        },
        body: JSON.stringify({
            query: print(document),
            variables,
        })
    });

    return response.json();
}
