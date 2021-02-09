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
    phone: '998997776611',
    role: 'user',
};

const sendData = {
    token: 'wrong-token',
}

const serverResponseData = {
    errors: [
        {
            message: 'Wrong token is provided.',
            locations: [
                {
                    line: 20,
                    column: 3,
                }
            ],
            path: [
                'add_email'
            ],
            extensions: {
                code: 'BAD_USER_INPUT',
                exception: {
                    stacktrace: [
						"Error: Wrong token is provided.",
						"    at addEmail (/app/services/user/add_email.js:73:9)",
						"    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
                    ],
                },
            },
        },
    ],
    data: {
        add_email: null,
    }
}

test('register calls fetch with the wrong arguments and returns error', async () => {
    fetch.mockReturnValue(Promise.resolve(new Response(JSON.stringify(serverResponseData))));

    const accessToken = await generateClaimsJwtToken(user, uuidv4.v4() + '-' + (+new Date()));

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
            add_email(
                token: ${sendData.token}
            )
        }`,
    });

	expect(response).toHaveProperty('errors');
	expect(response).toHaveProperty('data');
	expect(response.errors[0]).toHaveProperty('message');
	expect(response.errors[0].message).toContain('Wrong token is provided.');
	expect(response.errors[0]).toHaveProperty('locations');
	expect(response.errors[0]).toHaveProperty('path');
	expect(response.errors[0]).toHaveProperty('extensions');
	expect(response.errors[0].extensions).toHaveProperty('code');
	expect(response.errors[0].extensions).toHaveProperty('exception');
	expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
	expect(response.data).toHaveProperty('add_email');
	expect(response.data.add_email).toBeDefined();
	expect(response.data.add_email).toBeNull();

    // expect(response).toEqual(responseData);
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
            add_email(
                token: ${sendData.token}
            )
        }`,
    });

    return response.json();
}

