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
            extensions: {
                path: '$',
                code: 'invalid-jwt',
            },
            message: 'Could not verify JWT: JWTExpired',
        },
    ],
}

const responseData = {
    errors: [
        {
            extensions: {
                path: '$',
                code: 'invalid-jwt',
            },
            message: 'Could not verify JWT: JWTExpired',
        },
    ],
}

test('register calls fetch with the expired authorization token and returns error', async () => {
    fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(serverResponseData))));

    const accessToken = (await generateClaimsJwtToken(user, uuidv4.v4() + '-' + (+new Date()))).slice(1);

    const response = await mockFetch(sendData, accessToken);

    expect(fetch).toHaveBeenCalledTimes(1);

    expect(fetch).toHaveBeenCalledWith(expect.any(String), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: `mutation {
            send_add_email_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response.errors[0]).toHaveProperty('message');
    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('path');
    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions.code).toContain('invalid-jwt');
    expect(response.errors[0].message).toContain('Could not verify JWT: JWTExpired');

    expect(response).toEqual(responseData);
});

async function mockFetch(sendData, accessToken) {
    const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken}`,
        },
        body: `mutation {
            send_add_email_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    return response.json();
}
