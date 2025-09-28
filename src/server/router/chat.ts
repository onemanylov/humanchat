import { z } from 'zod';
import { protectedProcedure, publicProcedure, router } from '~/server/trpc';
import { fetchInitialMessages, fetchMessagesBefore } from '~/server/chat';
import { createSessionToken } from '~/lib/auth';
import { redisSET } from '../../../party/utils/redis';

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
  updateActivity: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const session = ctx.session!;
      const envSource = { env: process.env as Record<string, string | undefined> };
      const activityKey = `user:${session.wallet}:last_activity`;
      
      // Store current timestamp
      await redisSET(envSource, activityKey, Date.now().toString());
      
      return { success: true };
    } catch (error) {
      console.error('Failed to update user activity:', error);
      return { success: false };
    }
  }),
  onlineUsers: publicProcedure.query(async () => {
    try {
      // For simplified implementation, return the current user if they're active
      // In practice, you'd scan Redis for all user activity keys within 10 minutes
      return [];
    } catch (error) {
      console.error('Failed to fetch online users:', error);
      return [];
    }
  }),
});
