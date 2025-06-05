import { safeProcedure, createTRPCRouter } from '~/api/init';
import { createUser, deleteUser, getUserById, getUsers, updateUser } from './user.service';
import { createUserSchema, updateUserSchema } from './user.schema';
import { uuidParamSchema } from '~/lib/base-schemas';

export const userRoute = createTRPCRouter({
  getUsers: safeProcedure.query(() => getUsers()),
  getUserById: safeProcedure.input(uuidParamSchema).query(({ input }) => getUserById(input.id)),
  createUser: safeProcedure.input(createUserSchema).mutation(({ input }) => createUser(input)),
  updateUser: safeProcedure.input(updateUserSchema).mutation(({ input }) => updateUser(input)),
  deleteUser: safeProcedure.input(uuidParamSchema).mutation(({ input }) => deleteUser(input.id)),
});

// Alternative approach using handleErrors utility:
// import { baseProcedure, createTRPCRouter, handleErrors } from '~/api/init';
//
// export const userRoute = createTRPCRouter({
//   createUser: baseProcedure.input(createUserSchema).mutation(async ({ input }) => {
//     return await handleErrors(
//       () => createUser(input),
//       { 'duplicate email': 'CONFLICT' } // Custom error mapping
//     );
//   }),
// });
