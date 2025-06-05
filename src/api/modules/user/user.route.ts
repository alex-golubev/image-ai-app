import { TRPCError } from '@trpc/server';
import { baseProcedure, createTRPCRouter } from '~/api/init';
import { createUser, getUsers } from './user.service';
import { createUserSchema } from './user.schema';

export const userRoute = createTRPCRouter({
  createUser: baseProcedure.input(createUserSchema).mutation(async ({ input }) => {
    try {
      return await createUser(input);
    } catch (error) {
      if (error instanceof Error) {
        // Specific errors with corresponding HTTP codes
        if (error.message.includes('already exists')) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Unknown error',
      });
    }
  }),
  getUsers: baseProcedure.query(async () => {
    try {
      return await getUsers();
    } catch (error) {
      if (error instanceof Error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error fetching users',
      });
    }
  }),
});
