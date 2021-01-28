'use strict';

const fetch = require('node-fetch');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid');
const { generateClaimsJwtToken } = require('../token-generators');

// import { v4 as uuidv4 } from "uuid";

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
	token: '58615',
}

const responseData = {
	data: {
		add_phone: true,
	},
};

const serverResponseData = {
	data: {
		add_phone: true,
	},
}

test('register calls fetch with the right arguments and returns boolean true', async () => {
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

	expect(response).toHaveProperty('data');
	expect(response.data).toHaveProperty('add_phone');
	expect(response.data.add_phone).toBeDefined();
	expect(response.data.add_phone).toBeTruthy();
	expect(response).toEqual(responseData);
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
