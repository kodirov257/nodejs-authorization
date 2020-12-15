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
    email: 'test@gmail.com',
}

const responseData = {
    data: {
        resend_email: true,
    },
};

const serverResponseData = {
    data: {
        resend_email: true,
    },
}

test('register calls fetch with the right arguments and returns boolean true', async () => {
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
            resend_email(
                email: ${sendData.email}
            )
        }`,
    });

    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('resend_email');
    expect(response.data.resend_email).toBeDefined();
    expect(response.data.resend_email).toBeTruthy();
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
            resend_email(
                email: ${sendData.email}
            )
        }`,
    });

    return response.json();
}