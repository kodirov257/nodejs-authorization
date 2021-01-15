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
  password: 'password',
}

const serverResponseData = {
  errors: [
    {
      message: 'Field \\"signin\\" argument \\"password\\" of type \\"String!\\" is required, but it was not provided.',
      locations: [
        {
          line: 70,
          column: 3,
        }
      ],
      extensions: {
        code: 'INTERNAL_SERVER_ERROR',
        exception: {
          stacktrace: [
            "GraphQLError: Field \\\"signin\\\" argument \\\"password\\\" of type \\\"String!\\\" is required, but it was not provided.",
            "    at Object.leave (/app/node_modules/graphql/validation/rules/ProvidedRequiredArgumentsRule.js:62:33)",
            "    at Object.leave (/app/node_modules/graphql/language/visitor.js:344:29)",
            "    at Object.leave (/app/node_modules/graphql/utilities/TypeInfo.js:390:21)",
            "    at visit (/app/node_modules/graphql/language/visitor.js:243:26)",
            "    at Object.validate (/app/node_modules/graphql/validation/validate.js:69:24)",
            "    at validate (/app/node_modules/apollo-server-core/dist/requestPipeline.js:221:34)",
            "    at Object.<anonymous> (/app/node_modules/apollo-server-core/dist/requestPipeline.js:118:42)",
            "    at Generator.next (<anonymous>)",
            "    at fulfilled (/app/node_modules/apollo-server-core/dist/requestPipeline.js:5:58)",
            "    at processTicksAndRejections (internal/process/task_queues.js:93:5)",
          ],
        },
      },
    },
  ],
  data: {
    signin: null,
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
            signin(
                password: ${sendData.password},
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
  expect(response.errors[0].message).toContain('Field \\"signin\\" argument \\"password\\" of type \\"String!\\" is required, but it was not provided.');
  expect(response.errors[0]).toHaveProperty('locations');
  expect(response.errors[0]).toHaveProperty('extensions');
  expect(response.errors[0].extensions).toHaveProperty('code');
  expect(response.errors[0].extensions).toHaveProperty('exception');
  expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
  expect(response.data).toHaveProperty('signin');
  expect(response.data.signin).toBeDefined();
  expect(response.data.signin).toBeNull();

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
            signin(
                password: ${sendData.password},
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
  });

  return response.json();
}
