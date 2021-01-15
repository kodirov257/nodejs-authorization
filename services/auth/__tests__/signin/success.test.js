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

const responseData = {
  data: {
    signin: {
      access_token: "access_token",
      refresh_token: "refresh_token",
      user_id: "1"
    },
  },
};

const serverResponseData = {
  data: {
    signin: {
      access_token: "access_token",
      refresh_token: "refresh_token",
      user_id: "1"
    },
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
            signin(
                login: ${sendData.login},
                password: ${sendData.password}
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
  });

  expect(response).toHaveProperty('data');
  expect(response.data).toHaveProperty('signin');
  expect(response.data.signin).toBeDefined();
  expect(response.data.signin).toBeTruthy();
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
            signin(
                login: ${sendData.login},
                password: ${sendData.password}
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
  });

  return response.json();
}
