import gql from "graphql-tag";
import has from "lodash/has";
import get from "lodash/get";

import { SERVICE_AUTH } from "../helpers/values";
import { LogFragment } from "../fragments";
import { hasuraQuery } from "./client";

export const log = (exception) => {
    const message = exception.message;
    let code = 200;
    const serviceType = SERVICE_AUTH;
    let stacktrace = null;
    if (has(exception, 'extensions.exception')) {
        stacktrace = get(exception, 'extensions.exception');
    } else if (has(exception, 'extensions.internal.error')) {
        stacktrace = get(exception, 'extensions.internal.error');
        code = has(exception, 'extensions.internal.error.status_code') ? get(exception, 'extensions.internal.error.status_code') : code;
    } else {
        code = has(exception, 'extensions.code') ? get(exception, 'extensions.code') : code;
    }

    const response = send(serviceType, code, message, stacktrace);
    // console.log(response);
    // console.log(exception);

    // throw exception;
}

const send = async (serviceType, code, message, stacktrace = null) => {
    try {
        const response = await hasuraQuery(
            gql`
                ${LogFragment}
                mutation($log: logs_insert_input!) {
                    insert_logs(objects: [$log]) {
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
                    stacktrace: stacktrace,
                }
            },
        );

        return get(response, 'data.logs[0]');
    } catch (e) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}