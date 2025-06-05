import { safeProcedure, createTRPCRouter } from '~/api/init';
import { createUser, getUsers } from './user.service';
import { createUserSchema } from './user.schema';

export const userRoute = createTRPCRouter({
  createUser: safeProcedure.input(createUserSchema).mutation(({ input }) => createUser(input)),

  getUsers: safeProcedure.query(() => getUsers()),
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
