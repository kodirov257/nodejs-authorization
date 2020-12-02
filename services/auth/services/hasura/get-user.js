import {hasuraQuery} from "../client";
import gql from "graphql-tag";
import {UserFragment} from "../../fragments";
import get from "lodash/get";

export const getUserByUsername = async (username) => {
    return getUser('username', username);
}

export const getUserByEmail = async (email) => {
    return getUser('email', email);
}

export const getUserByPhone = async (phone) => {
    return getUser('phone', phone);
}

const getUser = async (attribute, value) => {
    try {
        let condition = {};
        let where = {};
        where[attribute] = { _eq: value };
        condition.where = where;
        const response = await hasuraQuery(
            gql`
                ${UserFragment}
                query($where: users_bool_exp) {
                    users(where: $where) {
                        ...User
                    }
                }
            `,
            condition,
        );

        return get(response, 'data.users[0]');
    } catch (e) {
        // throw new Error('Unable to find the email');
        throw new Error(e.message);
    }
}