const moment = require('moment');
import gql from 'graphql-tag';

import { hasuraQuery } from '../../../../core/services';
import { UserFragment } from '../../fragments';

export const updateUser = async (userId, fields) => {
	fields.updated_at = moment().format('Y-M-D H:mm:ss');
	return hasuraQuery(
		gql`
			${UserFragment}
			mutation ($user: users_set_input, $id: users_pk_columns_input!) {
				update_users_by_pk(_set: $user, pk_columns: $id) {
					...User
				}
			}
		`,
		{
			user: fields,
			id: {
				id: userId,
			}
		}
	);
}
