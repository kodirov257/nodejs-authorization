import * as dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as path from 'path';
import fs from 'fs';

const envConfig: dotenv.DotenvParseOutput = dotenv.parse(fs.readFileSync(path.resolve(__dirname, '../../../../../.env.test')));
for (const k in envConfig) {
    process.env[k] = envConfig[k];
}

jest.mock('node-fetch');
const { Response } = jest.requireActual('node-fetch');

const sendData = {
    username: 'test',
    email_or_phone: 'test@example.com',
    password: 'test_password',
}

const serverResponseData = {
    errors: [
        {
            message: 'Username already registered',
            locations: [
                {
                    line: 2,
                    column: 3,
                },
            ],
            path: [
                'register',
            ],
            extensions: {
                code: 'INTERNAL_SERVER_ERROR',
                exception: {
                    stacktrace: [
                        "Error: Username already registered",
                        "    at register (/app/services/auth/features/BasicAuth/register.ts:27:15)",
                        "    at process._tickCallback (internal/process/next_tick.js:68:7)",
                    ]
                }
            }
        },
    ]
}