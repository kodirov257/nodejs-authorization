import gql from "graphql-tag";

export const UserNetworkFragment = gql`
    fragment UserNetwork on auth_user_networks {
        user_id
        network
        identity
    }
`;
