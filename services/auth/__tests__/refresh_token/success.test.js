'use strict';

const fetch = require('node-fetch');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid');
const { generateClaimsJwtToken } = require('../token-generators');

const envConfig = dotEnv.parse(fs.readFileSync(path.resolve(__dirname, '../../.env.test')));
for (const k in envConfig) {
    process.env[k] = envConfig[k]
}

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const date = +new Date();
const newJwtExpiry = (process.env.REFRESH_TOKEN_EXPIRES_IN_MIN) || 10080 * 60 * 1000;

const getExpiresDate = () => new Date(Date.now() + newJwtExpiry);

const user = {
    id: 1,
    username: 'test',
    email: 'test@gmail.com',
    role: 'user',
};

const responseData = {
    data: {
        refresh_token: {
            access_token: 'access-token',
        },
    },
};

const serverResponseData = {
    data: {
        refresh_token: {
            access_token: 'access-token',
						refresh_token: 'refresh-token',
						expires_at: getExpiresDate(),
						user_id: '1',
        },
    },
}

const sendData = {
    refresh_token: 'right-refresh-token',
}

test('register calls fetch with the right refresh token and returns boolean true', async () => {
    const accessToken = await generateClaimsJwtToken(user, uuidv4.v4() + '-' + date);
    responseData.data.refresh_token.access_token = accessToken;
    serverResponseData.data.refresh_token.access_token = accessToken;
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

    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('refresh_token');
    expect(response.data.refresh_token).toHaveProperty('access_token');
    expect(response.data.refresh_token).toHaveProperty('expires_at');
    expect(response.data.refresh_token).toHaveProperty('user_id');
    expect(response.data.refresh_token.access_token).toContain(accessToken);
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
