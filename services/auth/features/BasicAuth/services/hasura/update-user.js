const moment = require('moment');
import gql from 'graphql-tag';
import get from 'lodash/get';

import { hasuraQuery } from '../../../../core/services';
import { UserFragment } from '../../fragments';

export const updateUser = async (userId, fields) => {
	fields.updated_at = moment().format('Y-M-D H:mm:ss');
	try {
		const result = hasuraQuery(
			gql`
				${UserFragment}
				mutation ($user: auth_users_set_input, $id: auth_users_pk_columns_input!) {
					update_auth_users_by_pk(_set: $user, pk_columns: $id) {
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

		return get(result, 'data.update_auth_users_by_pk');
	} catch (e) {
		throw new Error(e.message);
	}
}
