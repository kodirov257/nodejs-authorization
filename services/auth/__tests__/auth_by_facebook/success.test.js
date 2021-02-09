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
	token: 'right-token',
}

const responseData = {
	data: {
		auth_by_facebook: {
			access_token: "access_token",
			refresh_token: "refresh_token",
			user_id: "3"
		},
	},
};

const serverResponseData = {
	data: {
		auth_by_facebook: {
			access_token: "access_token",
			refresh_token: "refresh_token",
			user_id: "3"
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
            auth_by_facebook(
                token: ${sendData.token}
            ) {
            	access_token
							refresh_token
							user_id
            }
        }`,
    });

    expect(response).toHaveProperty('data');
    expect(response.data).toHaveProperty('auth_by_facebook');
    expect(response.data.auth_by_facebook).toBeDefined();
    expect(response.data.auth_by_facebook).toBeTruthy();
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
            auth_by_facebook(
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
