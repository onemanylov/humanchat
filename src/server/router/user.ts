import { z } from 'zod';
import { publicProcedure, router } from '~/server/trpc';
import { db } from '~/db/client';
import { users } from '~/db/schema';
import { eq } from 'drizzle-orm';

export const userRouter = router({
  get: publicProcedure
    .input(z.object({ wallet: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const wallet = input?.wallet ?? ctx.session?.wallet ?? null;
      if (!wallet) return { user: null };
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.wallet, wallet))
        .limit(1);
      return { user: user ?? null };
    }),
});
