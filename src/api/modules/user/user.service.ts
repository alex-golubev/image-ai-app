import { db } from '~/db';
import { users } from '~/db/schema/user';
import { handleDbOperation, handleDbRead } from '~/lib/db-error-handler';
import { Entity, EntityPlural } from '~/lib/entities';
import type { CreateUser, UpdateUser } from './user.schema';
import { eq } from 'drizzle-orm';

// Alternative approach using entity error handler factory:
// import { createEntityErrorHandler } from '~/lib/db-error-handler';
// const { handleOperation, handleRead } = createEntityErrorHandler(Entity.User, {
//   'email': 'User with this email already exists',
//   'username': 'Username is already taken',
// });

export const createUser = async (input: CreateUser) => {
  return await handleDbOperation(
    () =>
      db.insert(users).values(input).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      }),
    Entity.User,
    {
      email: 'User with this email already exists', // Custom message for email conflicts
    },
  );
};

export const getUsers = async () => {
  return await handleDbRead(
    () =>
      db.query.users.findMany({
        columns: {
          id: true,
          name: true,
          email: true,
        },
      }),
    EntityPlural.Users,
  );
};

export const getUserById = async (id: string) => {
  const result = await handleDbRead(
    () =>
      db.query.users.findFirst({
        where: eq(users.id, id),
        columns: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      }),
    Entity.User,
  );

  if (!result) {
    throw new Error('User not found');
  }

  return result;
};

export const updateUser = async ({ id, ...input }: UpdateUser) => {
  return await handleDbOperation(
    () =>
      db.update(users).set(input).where(eq(users.id, id)).returning({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
      }),
    Entity.User,
    {
      email: 'Email is already taken by another user',
      'not found': 'User not found',
    },
  );
};

export const deleteUser = async (id: string) => {
  return await handleDbOperation(
    () => db.delete(users).where(eq(users.id, id)).returning({ id: users.id }),
    Entity.User,
  );
};
