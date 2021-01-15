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
  token: 'wrong-token',
}

const serverResponseData = {
  errors: [
    {
      message: 'Wrong google token is provided.',
      locations: [
        {
          line: 60,
          column: 3,
        }
      ],
      path: [
        'auth_by_google'
      ],
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        exception: {
          stacktrace: [
            "Error: Wrong google token is provided.",
            "    at Google.authorize (/app/features/NetworkAuth/services/auth/network.js:46:10)",
            "    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
          ],
        },
      },
    },
  ],
  data: {
    auth_by_google: null,
  }
}

test('register calls fetch with the wrong arguments and returns error', async () => {
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
            auth_by_google(
                token: ${sendData.token}
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
  });

  expect(response).toHaveProperty('errors');
  expect(response).toHaveProperty('data');
  expect(response.errors[0]).toHaveProperty('message');
  expect(response.errors[0].message).toContain('Wrong facebook token is provided.');
  expect(response.errors[0]).toHaveProperty('locations');
  expect(response.errors[0]).toHaveProperty('path');
  expect(response.errors[0]).toHaveProperty('extensions');
  expect(response.errors[0].extensions).toHaveProperty('code');
  expect(response.errors[0].extensions).toHaveProperty('exception');
  expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
  expect(response.data).toHaveProperty('auth_by_google');
  expect(response.data.auth_by_google).toBeDefined();
  expect(response.data.auth_by_google).toBeNull();

  // expect(response).toEqual(responseData);
});

async function mockFetch(sendData) {
  const response = await fetch(process.env.HASURA_GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: `mutation {
            auth_by_google(
                token: ${sendData.token}
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
  });

  return response.json();
}
