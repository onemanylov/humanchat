import { router } from '~/server/trpc';
import { authRouter } from './auth';
import { userRouter } from './user';
import { chatRouter } from './chat';

export const appRouter = router({
  auth: authRouter,
  user: userRouter,
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;
