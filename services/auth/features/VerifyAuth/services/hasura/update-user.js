const moment = require('moment');
import gql from "graphql-tag";

import { UserFragment, UserVerificationFragment } from '../../fragments';
import { hasuraQuery } from '../../../../core/services';

export const updateUser = async (userId, userFields, userVerificationFields = {}) => {
	userFields.updated_at = moment().format('Y-M-D H:mm:ss');
	return hasuraQuery(
		gql`
			${UserFragment}
			${UserVerificationFragment}
			mutation (
				$user: auth_users_set_input,
				$id: auth_users_pk_columns_input!,
				$verification: auth_user_verifications_set_input,
				$user_id: auth_user_verifications_pk_columns_input!
			) {
				update_auth_users_by_pk(_set: $user, pk_columns: $id) {
					...User
				},
				update_auth_user_verifications_by_pk(_set: $verification, pk_columns: $user_id) {
					...UserVerification
				}
			}
		`,
		{
			user: userFields,
			id: {
				id: userId,
			},
			verification: userVerificationFields,
			user_id: {
				user_id: userId,
			}
		}
	);
}
