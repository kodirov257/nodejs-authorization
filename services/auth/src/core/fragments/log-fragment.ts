import gql from 'graphql-tag';

export const LogFragment = gql`
    fragment Log on core_logs {
        id
        service_type
        code
        message
        stacktrace
        created_at
    }
`;