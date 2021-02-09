const Boom = require('@hapi/boom');
const fs = require('fs');
const path = require('path');
const dotEnv = require('dotenv');

const envConfig = dotEnv.parse(fs.readFileSync(path.resolve(__dirname, '../.env.test')));
for (const k in envConfig) {
	process.env[k] = envConfig[k]
}

const { JWT, JWK } = require('jose');
const JWT_KEY_FILE_PATH = path.resolve(process.env.PWD || '.', 'core/keys/private.pem');

const RSA_TYPES = ['RS256', 'RS384', 'RS512'];
const SHA_TYPES = ['HS256', 'HS384', 'HS512'];

console.log(process.env.JWT_ALGORITHM);

const checkEncryptionType = (jwtKey) => {
	if (RSA_TYPES.includes(process.env.JWT_ALGORITHM)) {
		if (jwtKey) {
			try {
				jwtKey = JWK.asKey(jwtKey, {alg: process.env.JWT_ALGORITHM});
				jwtKey.toPEM(true);
			} catch (error) {
				throw Boom.badImplementation('Invalid RSA private key in the JWT_KEY environment variable.');
			}
		} else {
			try {
				const file = fs.readFileSync(JWT_KEY_FILE_PATH);
				jwtKey = JWK.asKey(file);
			} catch (error) {
				jwtKey = JWK.generateSync('RSA', 2048, {alg: process.env.JWT_ALGORITHM, use: 'sig'}, true);
				fs.writeFileSync(JWT_KEY_FILE_PATH, jwtKey.toPEM(true));
			}
		}
	} else if (SHA_TYPES.includes(process.env.JWT_ALGORITHM)) {
		if (!jwtKey) {
			throw Boom.badImplementation('Empty JWT secret key.');
		}
	} else {
		throw Boom.badImplementation(`Invalid JWT algorithm: ${process.env.JWT_ALGORITHM}`);
	}

	return jwtKey;
}

const jwtKey = checkEncryptionType(process.env.JWT_KEY)

const generateClaimsJwtToken = (user, sessionId = null) =>
	generateJwtAccessToken({['https://hasura.io/jwt/claims']: generatePermissionVariables({user, sessionId}, true)});

const generateJwtAccessToken = (payload) =>
	JWT.sign(payload, jwtKey, {
		algorithm: 'RS256',
		expiresIn: `${(process.env.JWT_TOKEN_EXPIRES_MIN || 15)}m`
	});

const generatePermissionVariables = ({ account_roles = [], user, sessionId }, jwt = true) => {
	const headerPrefix = jwt ? 'x-hasura-' : '';

	const accountRoles = account_roles.map(({ role: roleName }) => roleName);
	if (!accountRoles.includes(user.role)) {
		accountRoles.push(user.role);
	}

	return  {
		[`${headerPrefix}allowed-roles`]: accountRoles,
		[`${headerPrefix}default-role`]: user.role,
		[`${headerPrefix}role`]: user.role,
		[`${headerPrefix}user-id`]: user.id.toString(),
		[`${headerPrefix}session-id`]: sessionId,
	};
}

module.exports = {
	generateClaimsJwtToken,
	generateJwtAccessToken,
}

