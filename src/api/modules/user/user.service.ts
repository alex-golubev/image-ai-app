import { db } from '~/db';
import { users } from '~/db/schema/user';
import type { CreateUser } from './user.schema';

export const createUser = async (input: CreateUser) => {
  try {
    return await db.insert(users).values(input).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      avatar: users.avatar,
    });
  } catch (error) {
    // Handle database errors
    if (error instanceof Error) {
      // Email duplication (unique constraint)
      if (error.message.includes('unique constraint') || error.message.includes('duplicate key')) {
        throw new Error('User with this email already exists');
      }
      // Other database errors
      throw new Error(`Error creating user: ${error.message}`);
    }
    throw new Error('Unknown error while creating user');
  }
};

export const getUsers = async () => {
  try {
    return await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
    throw new Error('Unknown error while fetching users');
  }
};
