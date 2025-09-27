import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '~/server/router/_app';
import { createContext } from '~/server/trpc';

export const runtime = 'nodejs';

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext({ req }) {
      // @ts-expect-error next/fetch Request vs NextRequest types
      return createContext({ req });
    },
    responseMeta({ ctx }) {
      const headers: Record<string, string | string[] | undefined> = {};
      if (ctx?.setCookies?.length) {
        headers['Set-Cookie'] = ctx.setCookies;
      }
      return { headers };
    },
  });
};

export { handler as GET, handler as POST };
