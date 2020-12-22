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
    phone: '998997776611',
    role: 'user',
};

const sendData = {
	phone: '998997776611',
	token: '586151',
}

const serverResponseData = {
    errors: [
        {
            message: 'Provided token is not equal to the current user.',
            locations: [
                {
                    line: 28,
                    column: 3,
                }
            ],
            path: [
                'add_phone'
            ],
            extensions: {
                code: 'BAD_USER_INPUT',
                exception: {
                    stacktrace: [
						"Error: Provided token is not equal to the current user.",
						"    at addPhone (/app/services/user/add_phone.js:83:9)",
						"    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
                    ],
                },
            },
        },
    ],
    data: {
        add_phone: null,
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
            add_phone(
            	phone: ${sendData.phone},
                token: ${sendData.token}
            )
        }`,
    });

	expect(response).toHaveProperty('errors');
	expect(response).toHaveProperty('data');
	expect(response.errors[0]).toHaveProperty('message');
	expect(response.errors[0].message).toContain('Provided token is not equal to the current user.');
	expect(response.errors[0]).toHaveProperty('locations');
	expect(response.errors[0]).toHaveProperty('path');
	expect(response.errors[0]).toHaveProperty('extensions');
	expect(response.errors[0].extensions).toHaveProperty('code');
	expect(response.errors[0].extensions).toHaveProperty('exception');
	expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
	expect(response.data).toHaveProperty('add_phone');
	expect(response.data.add_phone).toBeDefined();
	expect(response.data.add_phone).toBeNull();

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
            add_phone(
            	phone: ${sendData.phone},
                token: ${sendData.token}
            )
        }`,
    });

    return response.json();
}

const generateJwtAccessToken = (payload) => {
    const jwtOptions = {
        algorithm: process.env.JWT_ALGORITHM,
        expiresIn: `${process.env.JWT_TOKEN_EXPIRES_MIN}m`,
    };

    return jwt.sign(payload, process.env.JWT_PRIVATE_KEY, jwtOptions);
}

const generateClaimsJwtToken = (user, sessionId = null) => {
    const headerPrefix = process.env.HASURA_GRAPHQL_HEADER_PREFIX;

    let today = new Date();
    let date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    let time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let dateTime = date+' '+time;

    const payload = {
        [process.env.HASURA_GRAPHQL_CLAIMS_KEY]: {
            [`${headerPrefix}allowed-roles`]: [user.role],
            [`${headerPrefix}default-role`]: user.role,
            [`${headerPrefix}role`]: user.role,
            [`${headerPrefix}user-id`]: user.id.toString(),
            [`${headerPrefix}session-id`]: sessionId,
            [`${headerPrefix}signed-at`]: dateTime,
        },
    };

    return generateJwtAccessToken(payload);
};
