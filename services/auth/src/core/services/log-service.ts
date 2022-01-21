import { GraphQLError } from 'graphql';
import lodash from 'lodash';
import gql from 'graphql-tag';

import { SERVICE_AUTH } from '../helpers/values';
import { hasuraQuery } from '../helpers/client';
import { LogFragment } from '../fragments';
import { LogModel } from '../models';

const { has } = lodash;

export class LogService {
    public log = async (exception: GraphQLError) => {
        const message: string = exception.message;
        const serviceType: string = SERVICE_AUTH;
        let stacktrace: any = null;
        let code: number = 200;

        if (has(exception, 'extensions.exception')) {
            stacktrace = exception.extensions.exception;
        } else if (has(exception, 'extensions.internal.error')) {
            stacktrace = exception.extensions.internal.error;
            code = exception.extensions.internal.error.status_code ?? code;
        } else {
            code = exception.extensions.code ?? code;
        }

        return this.send(serviceType, code, message, stacktrace);
    }

    private send = async (serviceType: string, code: number, message: string, stacktrace: any): Promise<boolean> => {
        try {
            const response = await hasuraQuery<{ core_logs: LogModel[] }>(
                gql`
                    ${LogFragment}
                    mutation ($log: core_logs_insert_input!) {
                        insert_core_logs(objects: [$log]) {
                            returning {
                                ...Log
                            }
                        }
                    }
                `,
                {
                    log: {
                        service_type: serviceType,
                        code: code.toString(),
                        message: message,
                        stacktrace: JSON.stringify(stacktrace),
                    },
                }
            );


            return true;
        } catch (e: any) {
            console.log(e);
            return false;
            // throw new Error(e.message);
        }
    }
}
