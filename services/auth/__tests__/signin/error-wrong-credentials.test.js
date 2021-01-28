'use strict';
const fetch = require('node-fetch');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envConfig = dotEnv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env.test')));
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const sendData = {
	login: 'wrong-login',
	password: 'wrong-password',
}

const serverResponseData = {
    errors: [
        {
            message: 'Invalid \\"username\\" or \\"password\\"',
            locations: [
                {
                    line: 70,
                    column: 3,
                }
            ],
            path: [
                'signin'
            ],
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                    stacktrace: [
											"Error: Invalid \\\"username\\\" or \\\"password\\\"",
											"    at GetUser.getUserByCredentials (/app/features/VerifyAuth/services/hasura/get-user.js:28:10)",
											"    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
											"    at async Signin.signin (/app/features/VerifyAuth/services/auth/login.js:10:16)",
                    ],
                },
            },
        },
    ],
    data: {
        signin: null,
    }
}

test('register calls fetch with the wrong arguments and returns error', async () => {
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
            signin(
                login: ${sendData.login},
                password: ${sendData.password}
            ) {
            	access_token
							refresh_token
							expires_at
							user_id
            }
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response).toHaveProperty('data');
    expect(response.errors[0]).toHaveProperty('message');
	expect(response.errors[0].message).toContain('Invalid \\"username\\" or \\"password\\"');
    expect(response.errors[0]).toHaveProperty('locations');
    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('signin');
    expect(response.data.signin).toBeDefined();
    expect(response.data.signin).toBeNull();

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
            signin(
                login: ${sendData.login},
                password: ${sendData.password}
            ) {
            	access_token
							refresh_token
							expires_at
							user_id
            }
        }`,
    });

    return response.json();
}
