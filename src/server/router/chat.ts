import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '~/server/trpc';
import {
  fetchInitialMessages,
  fetchMessagesBefore,
} from '~/server/chat';
import { createSessionToken } from '~/lib/auth';

const limitSchema = z
  .number()
  .int({ message: 'limit must be an integer' })
  .min(1)
  .max(200)
  .optional();

export const chatRouter = router({
  initialMessages: publicProcedure
    .input(z.object({ limit: limitSchema }).optional())
    .query(async ({ input }) => {
      return fetchInitialMessages(input?.limit);
    }),
  loadMore: publicProcedure
    .input(
      z.object({
        beforeTimestamp: z
          .number({ invalid_type_error: 'beforeTimestamp must be a number' })
          .int({ message: 'beforeTimestamp must be an integer' }),
        limit: limitSchema,
      }),
    )
    .query(async ({ input }) => {
      return fetchMessagesBefore(input.beforeTimestamp, input.limit);
    }),
  connectionToken: protectedProcedure.query(async ({ ctx }) => {
    const session = ctx.session!;
    const token = await createSessionToken({
      wallet: session.wallet,
      username: session.username ?? null,
    });

    return { token };
  }),
});
