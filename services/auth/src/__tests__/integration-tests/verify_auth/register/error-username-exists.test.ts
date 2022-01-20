import * as dotenv from 'dotenv';
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
    data: null,
    errors: [
        {
            message: 'Username already registered',
            locations: [
                {
                    line: 1,
                    column: 75  ,
                },
            ],
            path: [
                'auth_register',
            ],
            extensions: {
                exception: {
                    stacktrace: [
                        "Error: Username already registered",
                        "    at RegisterService.validateUser (file:///app/src/core/abstracts/services/basic-register-service.ts:68:19)",
                        "    at processTicksAndRejections (node:internal/process/task_queues:96:5)",
                        "    at async RegisterService.register (file:///app/src/core/abstracts/services/basic-register-service.ts:32:9)",
                        "    at async RegisterService.register (file:///app/src/features/VerifyAuth/services/auth/register-service.ts:75:9)",
                        "    at async VerifyAuth.register (file:///app/src/features/VerifyAuth/resolvers.ts:30:28)"
                    ]
                },
                code: 'INTERNAL_SERVER_ERROR'
            }
        },
    ]
}