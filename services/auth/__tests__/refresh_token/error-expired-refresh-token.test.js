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

const date = +new Date();
const user = {
    id: 1,
    username: 'test',
    email: 'test@gmail.com',
    role: 'user',
};

const sendData = {
    refresh_token: 'expired-refresh-token',
};

const serverResponseData = {
    errors: [
        {
            message: 'Session is expired.',
            locations: [
                {
                    line: 52,
                    column: 3,
                }
            ],
            path: [
                'refresh_token'
            ],
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                    stacktrace: [
                        "Error: Session is expired.",
                        "    at refreshToken (/app/services/auth/refresh_token.js:21:15)",
                        "    at process._tickCallback (internal/process/next_tick.js:68:7)",
                    ],
                },
            },
        },
    ],
    data: {
        refresh_token: null,
    }
}

test('register calls fetch with the expired refresh token and returns error', async () => {
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
            refresh_token(
                refresh_token: ${sendData.refresh_token}
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
    expect(response.errors[0].message).toContain('Session is expired.');
    expect(response.errors[0]).toHaveProperty('locations');
    expect(response.errors[0].locations[0]).toHaveProperty('line');
    expect(response.errors[0].locations[0]).toHaveProperty('column');
    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions.code).toContain('INTERNAL_SERVER_ERROR');
    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('refresh_token');
    expect(response.data.refresh_token).toBeDefined();
    expect(response.data.refresh_token).toBeNull();
});

async function mockFetch(sendData) {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            refresh_token(
                refresh_token: ${sendData.refresh_token}
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
