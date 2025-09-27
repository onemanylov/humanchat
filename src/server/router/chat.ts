import { z } from 'zod';
import { publicProcedure, router } from '~/server/trpc';
import {
  fetchInitialMessages,
  fetchMessagesBefore,
} from '~/server/chat';

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
});
