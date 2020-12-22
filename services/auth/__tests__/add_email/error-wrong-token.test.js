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
    email: null,
    phone: '998997776611',
    role: 'user',
};

const sendData = {
    email: 'testgmail.com',
}

const serverResponseData = {
    errors: [
        {
            message: 'Failed to register the user.',
            locations: [
                {
                    line: 16,
                    column: 3,
                }
            ],
            path: [
                'send_add_email_token'
            ],
            extensions: {
                validationErrors: [
                    {
                        message: '\"email\" with value \"abdurahmonkodirov97gmail.com\" fails to match the required pattern: /^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\\\.[a-zA-Z0-9-]+)*$/',
                        path: [
                            'email',
                        ],
                        type: 'string.pattern.base',
                        context: {
                            regex: {},
                            value: 'testgmail.com',
                            label: 'email',
                            key: 'email',
                        },
                    },
                ],
                code: 'BAD_USER_INPUT',
                exception: {
                    validationErrors: [
                        {
                            message: '\"email\" with value \"abdurahmonkodirov97gmail.com\" fails to match the required pattern: /^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\\\.[a-zA-Z0-9-]+)*$/',
							path: [
								'email',
							],
							type: 'string.pattern.base',
							context: {
								regex: {},
								value: 'testgmail.com',
								label: 'email',
								key: 'email',
							},
                        }
                    ],
                    stacktrace: [
						"UserInputError: Failed to register the user.",
						"    at validateGeneral (/app/validators/auth.js:65:15)",
						"    at validateEmail (/app/validators/auth.js:26:12)",
						"    at sendEmailAddEmailToken (/app/services/user/add_email.js:13:19)",
						"    at send_add_email_token (/app/app.js:126:14)",
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
        send_add_email_token: null,
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
            send_add_email_token(
                email: ${sendData.email}
            )
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response).toHaveProperty('data');

    expect(response.errors[0]).toHaveProperty('message');
    expect(response.errors[0].message).toContain('Failed to register the user.');
    expect(response.errors[0]).toHaveProperty('locations');

    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0].path).toContain('send_add_email_token');

    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.validationErrors[0].message).toContain(
    	'\"email\" with value \"abdurahmonkodirov97gmail.com\" fails to match the required pattern: /^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\\\.[a-zA-Z0-9-]+)*$/'
	);
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.validationErrors[0].path[0]).toContain('email');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.validationErrors[0].type).toContain('string.pattern.base');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('regex');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.validationErrors[0].context.label).toContain('email');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.validationErrors[0].context.key).toContain('email');

    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions.code).toContain('BAD_USER_INPUT');

    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.exception.validationErrors[0].message).toContain(
    	'\"email\" with value \"abdurahmonkodirov97gmail.com\" fails to match the required pattern: /^[a-zA-Z0-9.!#$%&\'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\\\\.[a-zA-Z0-9-]+)*$/'
	);
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.exception.validationErrors[0].path[0]).toContain('email');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.exception.validationErrors[0].type).toContain('string.pattern.base');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('regex');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.label).toContain('email');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.key).toContain('email');

    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('send_add_email_token');
    expect(response.data.send_add_email_token).toBeDefined();
    expect(response.data.send_add_email_token).toBeNull();

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
            send_add_email_token(
                email: ${sendData.email}
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
