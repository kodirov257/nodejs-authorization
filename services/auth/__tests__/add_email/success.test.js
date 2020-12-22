'use strict';

const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');
const dotEnv = require('dotenv');
const path = require('path');
const fs = require('fs');
const uuidv4 = require('uuid');

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
	token: 'right-token',
}

const responseData = {
	data: {
		add_email: true,
	},
};

const serverResponseData = {
	data: {
		add_email: true,
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
            add_email(
                token: ${sendData.token}
            )
        }`,
	});

	expect(response).toHaveProperty('data');
	expect(response.data).toHaveProperty('add_email');
	expect(response.data.add_email).toBeDefined();
	expect(response.data.add_email).toBeTruthy();
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
            add_email(
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
