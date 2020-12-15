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
    phone: '+998997776611',
    token: '14790',
    password: "password",
}

const responseData = {
    data: {
        reset_via_phone: true,
    },
};

const serverResponseData = {
    data: {
        reset_via_phone: true,
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
            reset_via_phone(
                phone: ${sendData.phone}
                token: ${sendData.token}
                password: ${sendData.password}
            )
        }`,
    });

    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('reset_via_phone');
    expect(response.data.reset_via_phone).toBeDefined();
    expect(response.data.reset_via_phone).toBeTruthy();
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
            reset_via_phone(
                phone: ${sendData.phone}
                token: ${sendData.token}
                password: ${sendData.password}
            )
        }`,
    });

    return response.json();
}