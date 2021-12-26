import gql from 'graphql-tag';
import moment from 'moment';

import { UserFragment, UserVerificationFragment } from '../fragments';
import { hasuraQuery } from '../../../core/helpers/client';
import { User, UserVerification } from '../models';
import { VerificationForm } from '../forms';

export const updateUser = async (userId: string, userFields: any, userVerificationFields: VerificationForm|{} = {}) => {
    userFields.updated_at = moment().format('Y-M-D H:mm:ss');

    try {
        const result = await hasuraQuery<{
            update_auth_users_by_pk: User|undefined,
            update_auth_user_verifications_by_pk: UserVerification|undefined,
        }>(
            gql`
                ${UserFragment}
                ${UserVerificationFragment}
                mutation (
                    $user: auth_users_set_input,
                    $id: auth_users_pk_columns_input!,
                    $verification: auth_user_verifications_set_input,
                    $user_id: auth_user_verifications_pk_columns_input!,
                ) {
                    update_auth_users_by_pk(_set: $user, pk_columns: $id) {
                        ...User
                    }
                    update_auth_user_verifications_by_pk(_set: $verification, pk_columns: $user_id) {
                        ...User
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
                },
            }
        );

        const user = result.data?.update_auth_users_by_pk;
        const verification = result.data?.update_auth_user_verifications_by_pk;

        return {user, verification};
    } catch (e: any) {
        if (e instanceof Error) {
            throw new Error(e.message);
        }
        throw new Error('Internal error.');
    }
}