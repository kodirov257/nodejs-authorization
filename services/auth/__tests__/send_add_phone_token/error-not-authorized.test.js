'use strict';

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid');

const envConfig = dotEnv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env.test')));
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const user = {
	id: 1,
	username: 'test',
	email: 'test@gmail.com',
	phone: null,
	role: 'user',
};

const sendData = {
	phone: '998997776611',
}

const serverResponseData = {
    errors: [
        {
            message: 'Authorization token has not provided',
            locations: [
                {
                    line: 24,
                    column: 3,
                }
            ],
            path: [
                'send_add_phone_token'
            ],
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                    stacktrace: [
						"Error: Authorization token has not provided",
						"    at sendAddPhoneToken (/app/services/user/add_phone.js:18:9)",
						"    at send_add_phone_token (/app/app.js:132:14)",
						"    at field.resolve (/app/node_modules/graphql-extensions/dist/index.js:134:26)",
						"    at field.resolve (/app/node_modules/apollo-server-core/dist/utils/schemaInstrumentation.js:52:26)",
						"    at resolveField (/app/node_modules/graphql/execution/execute.js:466:18)",
						"    at /app/node_modules/graphql/execution/execute.js:263:18",
						"    at /app/node_modules/graphql/jsutils/promiseReduce.js:23:10",
						"    at Array.reduce (<anonymous>)",
						"    at promiseReduce (/app/node_modules/graphql/jsutils/promiseReduce.js:20:17)",
						"    at executeFieldsSerially (/app/node_modules/graphql/execution/execute.js:260:37)",
                    ],
                },
            },
        },
    ],
    data: {
        send_add_phone_token: null,
    }
}

test('register calls fetch with the wrong authorization token and returns error', async () => {
    fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(serverResponseData))));

    const response = await mockFetch(sendData);

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            send_add_phone_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response).toHaveProperty('data');
    expect(response.errors[0]).toHaveProperty('message');
    expect(response.errors[0]).toHaveProperty('locations');
    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('send_add_phone_token');
    expect(response.data.send_add_phone_token).toBeDefined();
    expect(response.data.send_add_phone_token).toBeNull();

    // expect(response).toEqual(responseData);
});

async function mockFetch(sendData) {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            send_add_phone_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    return response.json();
}
