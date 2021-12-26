import { User as BasicUser } from '../../../core/models/user';
import { UserVerification } from './user-verification';

export interface User extends BasicUser {
    user_verifications: [UserVerification];
}