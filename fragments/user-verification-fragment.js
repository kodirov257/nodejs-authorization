import gql from "graphql-tag";

export const UserVerificationFragment = gql`
    fragment UserVerification on user_verifications {
		user_id
		email_verify_token
		email_verified
		phone_verify_token
		phone_verify_token_expire
		phone_verified
    }
`;
