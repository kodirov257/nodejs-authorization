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
  login: 'login',
  password: 'password',
}

const serverResponseData = {
  errors: [
    {
      message: 'Field \\"signin\\" of type \\"AuthPayload\\" must have a selection of subfields. Did you mean \\"signin { ... }\\"?',
      locations: [
        {
          line: 16,
          column: 3,
        }
      ],
      extensions: {
        code: 'GRAPHQL_VALIDATION_FAILED',
        exception: {
          stacktrace: [
            "GraphQLError: Field \\\"signin\\\" of type \\\"AuthPayload\\\" must have a selection of subfields. Did you mean \\\"signin { ... }\\\"?",
            "    at Object.Field (/app/node_modules/graphql/validation/rules/ScalarLeafsRule.js:40:31)",
            "    at Object.enter (/app/node_modules/graphql/language/visitor.js:323:29)",
            "    at Object.enter (/app/node_modules/graphql/utilities/TypeInfo.js:370:25)",
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
    auth_by_facebook: null,
  }
}

test('register calls fetch with no return values provided and returns error', async () => {
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
            auth_by_facebook(
                login: ${sendData.login},
                password: ${sendData.password}
            )
        }`,
  });

  expect(response).toHaveProperty('errors');
  expect(response).toHaveProperty('data');
  expect(response.errors[0]).toHaveProperty('message');
  expect(response.errors[0].message).toContain('Field \\"signin\\" of type \\"AuthPayload\\" must have a selection of subfields. Did you mean \\"signin { ... }\\"?');
  expect(response.errors[0]).toHaveProperty('locations');
  expect(response.errors[0]).toHaveProperty('extensions');
  expect(response.errors[0].extensions).toHaveProperty('code');
  expect(response.errors[0].extensions).toHaveProperty('exception');
  expect(response.errors[0].extensions.exception).toHaveProperty('stacktrace');
  expect(response.data).toHaveProperty('auth_by_facebook');
  expect(response.data.auth_by_facebook).toBeDefined();
  expect(response.data.auth_by_facebook).toBeNull();

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
            auth_by_facebook(
                login: ${sendData.login},
                password: ${sendData.password}
            )
        }`,
  });

  return response.json();
}
