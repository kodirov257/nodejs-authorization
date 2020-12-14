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
    phone: '998997776644',
}

const responseData = {
    data: {
        resend_phone: true,
    },
};

const serverResponseData = {
    data: {
        resend_phone: true,
    },
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
            resend_phone(
                phone: ${sendData.phone}
            )
        }`,
    });

    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('resend_phone');
    expect(response.data.resend_phone).toBeDefined();
    expect(response.data.resend_phone).toBeTruthy();
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
            resend_phone(
                phone: ${sendData.phone}
            )
        }`,
    });

    return response.json();
}