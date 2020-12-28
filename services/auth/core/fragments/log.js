import gql from "graphql-tag";

export const LogFragment = gql`
    fragment Log on logs {
        id
        service_type
        code
        message
        stacktrace
        created_at
    }
`;