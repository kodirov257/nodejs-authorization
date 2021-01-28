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
	phone: '+9989977766111',
}

const serverResponseData = {
    errors: [
        {
            message: 'Failed to register the user.',
            locations: [
                {
                    line: 24,
                    column: 3,
                }
            ],
            path: [
                'send_add_phone_token'
            ],
            extensions: {
                validationErrors: [
                    {
                        message: '\"phone\" with value \"+9989977766111\" fails to match the required pattern: /\\\\+?998[0-9]{9}$/',
                        path: [
                            'phone',
                        ],
                        type: 'string.pattern.base',
                        context: {
                            regex: {},
                            value: '+9989979618799',
                            label: 'phone',
                            key: 'phone',
                        },
                    },
                ],
                code: 'BAD_USER_INPUT',
                exception: {
                    validationErrors: [
                        {
                            message: '\"phone\" with value \"+9989977766111\" fails to match the required pattern: /\\\\+?998[0-9]{9}$/',
							path: [
								'phone',
							],
							type: 'string.pattern.base',
							context: {
								regex: {},
								value: '+9989979618799',
								label: 'phone',
								key: 'phone',
							},
                        }
                    ],
                    stacktrace: [
						"UserInputError: Failed to register the user.",
						"    at validateGeneral (/app/validators/auth.js:65:15)",
						"    at validatePhone (/app/validators/auth.js:32:12)",
						"    at sendAddPhoneToken (/app/services/user/add_phone.js:14:16)",
						"    at send_add_phone_token (/app/app.js:132:14)",
						"    at field.resolve (/app/node_modules/graphql-extensions/dist/index.js:134:26)",
						"    at field.resolve (/app/node_modules/apollo-server-core/dist/utils/schemaInstrumentation.js:52:26)",
						"    at resolveField (/app/node_modules/graphql/execution/execute.js:466:18)",
						"    at /app/node_modules/graphql/execution/execute.js:263:18",
						"    at /app/node_modules/graphql/jsutils/promiseReduce.js:23:10",
						"    at Array.reduce (<anonymous>)",
                    ],
                },
            },
        },
    ],
    data: {
        send_add_phone_token: null,
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
            send_add_phone_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response).toHaveProperty('data');

    expect(response.errors[0]).toHaveProperty('message');
    expect(response.errors[0].message).toContain('Failed to register the user.');
    expect(response.errors[0]).toHaveProperty('locations');

    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0].path).toContain('send_add_phone_token');

    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.validationErrors[0].message).toContain(
    	'\"phone\" with value \"+9989977766111\" fails to match the required pattern: /\\\\+?998[0-9]{9}$/'
	);
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.validationErrors[0].path[0]).toContain('phone');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.validationErrors[0].type).toContain('string.pattern.base');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('regex');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.validationErrors[0].context.label).toContain('phone');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.validationErrors[0].context.key).toContain('phone');

    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions.code).toContain('BAD_USER_INPUT');

    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.exception.validationErrors[0].message).toContain(
    	'\"phone\" with value \"+9989977766111\" fails to match the required pattern: /\\\\+?998[0-9]{9}$/'
	);
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.exception.validationErrors[0].path[0]).toContain('phone');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.exception.validationErrors[0].type).toContain('string.pattern.base');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('regex');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.label).toContain('phone');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.key).toContain('phone');

    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('send_add_phone_token');
    expect(response.data.send_add_phone_token).toBeDefined();
    expect(response.data.send_add_phone_token).toBeNull();

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
            send_add_phone_token(
                phone: ${sendData.phone}
            )
        }`,
    });

    return response.json();
}
