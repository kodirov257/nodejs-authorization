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
    username: 'test',
    email_or_phone: 'test@gmail.com',
    password: 'test_password',
}

const responseData = {
    errors: [
        {
            message: 'Username already registered',
            locations: [
                {
                    line: 2,
                    column: 3,
                }
            ],
            path: [
                'register'
            ],
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                    stacktrace: [
                        "Error: Username already registered",
                        "    at register (/app/services/auth/register.js:27:15)",
                        "    at process._tickCallback (internal/process/next_tick.js:68:7)",
                    ],
                },
            },
        },
    ],
    data: {
        register: null,
    }
};

const serverResponseData = {
    errors: true,
}

test('register calls fetch with the right arguments and returns boolean true', async () => {
    fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(serverResponseData))));

    const response = await mockFetch(sendData);

    console.log(response);

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            register(username: ${sendData.username},
            email_or_phone: ${sendData.email_or_phone},
            password: ${sendData.password}
            )
        }`,
    });

    expect(response).toEqual(responseData);
});

async function mockFetch(sendData) {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            register(username: ${sendData.username},
            email_or_phone: ${sendData.email_or_phone},
            password: ${sendData.password}
            )
        }`,
    });

    return response.json();
}