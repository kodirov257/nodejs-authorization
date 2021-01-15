import gql from "graphql-tag";

export const UserNetworkFragment = gql`
    fragment UserNetwork on user_networks {
        user_id
        network
        identity
    }
`;
