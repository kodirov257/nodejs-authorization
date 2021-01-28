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
    role: 'user',
};

const sendData = {
    old_password: 'old-password',
    new_password: 'long-new-password-long-new-password-long-new-password-long-new-password-long-new-password',
}

const serverResponseData = {
    errors: [
        {
            message: 'Failed to change password.',
            locations: [
                {
                    line: 45,
                    column: 3,
                }
            ],
            path: [
                'change_password'
            ],
            extensions: {
                validationErrors: [
                    {
                        message: '\"newPassword\" length must be less than or equal to 50 characters long',
                        path: [
                            'newPassword',
                        ],
                        type: 'string.max',
                        context: {
                            limit: 50,
                            value: 'long-new-password-long-new-password-long-new-password-long-new-password-long-new-password',
                            label: 'newPassword',
                            key: 'newPassword',
                        },
                    },
                ],
                code: 'BAD_USER_INPUT',
                exception: {
                    validationErrors: [
                        {
                            message: '\"newPassword\" length must be less than or equal to 50 characters long',
                            path: [
                                "newPassword"
                            ],
                            type: "string.max",
                            context: {
                                limit: 50,
                                value: "long-new-password-long-new-password-long-new-password-long-new-password-long-new-password",
                                label: "newPassword",
                                key: "newPassword"
                            }
                        }
                    ],
                    stacktrace: [
                        "UserInputError: Failed to change password.",
                        "    at validateGeneral (/app/validators/auth.js:65:15)",
                        "    at validateChangePassword (/app/validators/auth.js:53:12)",
                        "    at changePassword (/app/services/user.js:25:5)",
                        "    at process._tickCallback (internal/process/next_tick.js:68:7)",
                    ],
                },
            },
        },
    ],
    data: {
        change_password: null,
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
            change_password(
                old_password: ${sendData.old_password},
                new_password: ${sendData.new_password}
            )
        }`,
    });

    expect(response).toHaveProperty('errors');
    expect(response).toHaveProperty('data');

    expect(response.errors[0]).toHaveProperty('message');
    expect(response.errors[0].message).toContain('Failed to change password.');
    expect(response.errors[0]).toHaveProperty('locations');

    expect(response.errors[0]).toHaveProperty('path');
    expect(response.errors[0].path).toContain('change_password');

    expect(response.errors[0]).toHaveProperty('extensions');
    expect(response.errors[0].extensions).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.validationErrors[0].message).toContain('\"newPassword\" length must be less than or equal to 50 characters long');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.validationErrors[0].path[0]).toContain('newPassword');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.validationErrors[0].type).toContain('string.max');
    expect(response.errors[0].extensions.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('limit');
    expect(response.errors[0].extensions.validationErrors[0].context.limit).toEqual(50);
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.validationErrors[0].context.label).toContain('newPassword');
    expect(response.errors[0].extensions.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.validationErrors[0].context.key).toContain('newPassword');

    expect(response.errors[0].extensions).toHaveProperty('code');
    expect(response.errors[0].extensions.code).toContain('BAD_USER_INPUT');

    expect(response.errors[0].extensions).toHaveProperty('exception');
    expect(response.errors[0].extensions.exception).toHaveProperty('validationErrors');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('message');
    expect(response.errors[0].extensions.exception.validationErrors[0].message).toContain('\"newPassword\" length must be less than or equal to 50 characters long');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('path');
    expect(response.errors[0].extensions.exception.validationErrors[0].path[0]).toContain('newPassword');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('type');
    expect(response.errors[0].extensions.exception.validationErrors[0].type).toContain('string.max');
    expect(response.errors[0].extensions.exception.validationErrors[0]).toHaveProperty('context');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('limit');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.limit).toEqual(50);
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('value');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('label');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.label).toContain('newPassword');
    expect(response.errors[0].extensions.exception.validationErrors[0].context).toHaveProperty('key');
    expect(response.errors[0].extensions.exception.validationErrors[0].context.key).toContain('newPassword');

    expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
    expect(response.data).toHaveProperty('change_password');
    expect(response.data.change_password).toBeDefined();
    expect(response.data.change_password).toBeNull();

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
            change_password(
                old_password: ${sendData.old_password},
                new_password: ${sendData.new_password}
            )
        }`,
    });

    return response.json();
}
