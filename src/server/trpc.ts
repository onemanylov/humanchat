import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { cookies } from "next/headers";
import { verifySessionToken, SessionPayload } from "~/lib/auth";
import type { NextRequest } from "next/server";

export type CreateContextOptions = {
  req: NextRequest;
};

export async function createContext(opts: CreateContextOptions) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await verifySessionToken(token) : null;
  const setCookies: string[] = [];

  type CookieSameSite = "lax" | "strict" | "none";
  type CookieOptions = {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: CookieSameSite;
    path?: string;
    maxAge?: number;
    expires?: Date;
    domain?: string;
  };

  const formatSetCookie = (
    name: string,
    value: string,
    options: CookieOptions,
  ): string => {
    const parts: string[] = [];
    parts.push(`${name}=${encodeURIComponent(value)}`);
    if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
    if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
    if (options.domain) parts.push(`Domain=${options.domain}`);
    parts.push(`Path=${options.path ?? "/"}`);
    if (options.httpOnly) parts.push("HttpOnly");
    if (options.secure) parts.push("Secure");
    if (options.sameSite)
      parts.push(
        `SameSite=${
          options.sameSite === "lax"
            ? "Lax"
            : options.sameSite === "strict"
              ? "Strict"
              : "None"
        }`,
      );
    return parts.join("; ");
  };

  const setCookie = (name: string, value: string, options?: CookieOptions) => {
    const defaults: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    };
    const finalOptions: CookieOptions = { ...defaults, ...(options ?? {}) };
    cookieStore.set({
      name,
      value,
      httpOnly: finalOptions.httpOnly,
      secure: finalOptions.secure,
      sameSite: finalOptions.sameSite,
      path: finalOptions.path,
      maxAge: finalOptions.maxAge,
      expires: finalOptions.expires,
      domain: finalOptions.domain,
    });
    setCookies.push(formatSetCookie(name, value, finalOptions));
  };

  const getCookie = (name: string): string | undefined => {
    return cookieStore.get(name)?.value;
  };

  const deleteCookie = (name: string) => {
    cookieStore.delete(name);
    setCookies.push(
      `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    );
  };

  return {
    req: opts.req,
    session: session as SessionPayload | null,
    setCookies,
    setCookie,
    getCookie,
    deleteCookie,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
const delayMiddleware = t.middleware(async ({ next }) => {
  if (process.env.NODE_ENV === "test") {
    await new Promise((r) => setTimeout(r, 200));
  }
  return next();
});

export const publicProcedure = t.procedure.use(delayMiddleware);
export const protectedProcedure = t.procedure
  .use(delayMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return next({ ctx });
  });
