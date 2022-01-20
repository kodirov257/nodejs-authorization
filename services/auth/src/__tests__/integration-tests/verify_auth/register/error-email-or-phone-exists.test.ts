import { enableFetchMocks } from 'jest-fetch-mock';

enableFetchMocks();

const sendData = {
    username: 'test',
    email_or_phone: 'test@example.com',
    password: 'test_password',
}

const serverResponseData = {
    data: null,
    errors: [
        {
            message: 'Email or phone is already registered.',
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
                        "Error: Email or phone is already registered.",
                        "    at RegisterService.validateUser (file:///app/src/core/abstracts/services/basic-register-service.ts:72:19)",
                        "    at processTicksAndRejections (node:internal/process/task_queues:96:5)",
                        "    at async RegisterService.register (file:///app/src/core/abstracts/services/basic-register-service.ts:32:9)",
                        "    at async RegisterService.register (file:///app/src/features/VerifyAuth/services/auth/register-service.ts:75:9)",
                        "    at async VerifyAuth.register (file:///app/src/features/VerifyAuth/resolvers.ts:30:28)",
                    ]
                },
                code: 'INTERNAL_SERVER_ERROR'
            }
        },
    ],
};

interface ResponseData {
    data: null;
    errors: IError[];
}

interface IError {
    message: string;
    locations: {
        line: number;
        column: number;
    }[];
    path: string[];
    extensions: {
        exception: {
            stacktrace: string[];
        };
        code: string;
    }
}

describe('testing register api', () => {
    fetchMock.mockReturnValue(Promise.resolve(new Response(JSON.stringify(serverResponseData))));
    beforeEach(() => {
        fetchMock.resetMocks();
    });

    it('should register calls fetch with the wrong arguments and returns error', async () => {
        fetchMock.mockResponseOnce(JSON.stringify(sendData));

        // Assert on the response
        const res = await register<ResponseData>(sendData);

        expect(res).toHaveBeenCalledTimes(1);

        expect(res).toHaveBeenCalledWith(expect.any(String), {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json',
            },
            body: `mutation {
                register(
                    username: ${sendData.username},
                    email_or_phone: ${sendData.email_or_phone},
                    password: ${sendData.password}
                )
            }`,
        });

        expect(res).toHaveProperty('errors');
        expect(res).toHaveProperty('data');

        expect(res.errors[0]).toHaveProperty('message');
        expect(res.errors[0]).toHaveProperty('locations');
        expect(res.errors[0]).toHaveProperty('path');
        expect(res.errors[0]).toHaveProperty('extensions');

        // @ts-ignore
        const error: IError = res.errors[0];
        expect(error.extensions).toHaveProperty('code');
        expect(error.extensions).toHaveProperty('exception');
        expect(error.extensions.exception).toHaveProperty('stacktrace');
        expect(res.data).toBeNull();

    });
});

test('register calls fetch with the wrong arguments and returns error', async () => {
    // fetchMock.mock(Promise.resolve(new Response(JSON.stringify(serverResponseData))));
});

async function register<T>(sendData: {username: string, email_or_phone: string, password: string}): Promise<T> {
    const url: string = process.env.HASURA_GRAPHQL_ENDPOINT!;
    const response: Response = await fetchMock(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
        body: `mutation {
            register(
                username: ${sendData.username},
                email_or_phone: ${sendData.email_or_phone},
                password: ${sendData.password}
            )
        }`,
    });

    return await response.json() as T;
}