import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "~/server/trpc";
import { users } from "~/db/schema";
import { db } from "~/db/client";
import { SESSION_COOKIE_NAME, createSessionToken } from "~/lib/auth";
import { verifySiweMessage } from "@worldcoin/minikit-js";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { BanService } from "~/lib/moderation/BanService";
import type { EnvLike } from "../../../party/utils/env";

const WalletAuthPayload = z.object({
  status: z.literal("success"),
  message: z.string(),
  signature: z.string(),
  address: z.string(),
  version: z.number(),
});

export const authRouter = router({
  nonce: publicProcedure.mutation(async ({ ctx }) => {
    const nonce = crypto.randomUUID().replace(/-/g, "");
    ctx.setCookie("siwe", nonce, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return { nonce };
  }),
  completeSiwe: publicProcedure
    .input(
      z.object({
        payload: WalletAuthPayload,
        nonce: z.string().min(8),
        username: z.string().nullish(),
        profilePictureUrl: z
          .string()
          .url()
          .nullish()
          .or(z.literal("").transform(() => null)),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const cookieNonce = ctx.getCookie("siwe");
      if (!cookieNonce || input.nonce !== cookieNonce) {
        return { status: "error", isValid: false };
      }
      // Skip SIWE verification in development mode with mock auth
      const isDevelopmentMockAuth = process.env.NODE_ENV === "development" && 
                                   env.NEXT_PUBLIC_MOCK_AUTH === "true";
      
      let validMessage = { isValid: true };
      
      if (!isDevelopmentMockAuth) {
        validMessage = await verifySiweMessage(input.payload, input.nonce);
        if (!validMessage.isValid) {
          return { status: "error", isValid: false };
        }
      }
      const token = await createSessionToken({
        wallet: input.payload.address,
        username: input.username ?? null,
      });
      await db
        .insert(users)
        .values({
          wallet: input.payload.address,
          username: input.username ?? null,
          profilePictureUrl: input.profilePictureUrl ?? null,
        })
        .onConflictDoUpdate({
          target: users.wallet,
          set: {
            username: input.username ?? null,
            profilePictureUrl: input.profilePictureUrl ?? null,
          },
        });

      ctx.setCookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });
      return { status: "success", isValid: true };
    }),
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.wallet, ctx.session!.wallet))
      .limit(1);

    // Check ban status
    let banStatus = null;
    try {
      const envSource: EnvLike = {
        env: {
          UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
          UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
          VITE_NETWORK: process.env.VITE_NETWORK ?? 'default',
        },
      };
      
      const banService = new BanService(envSource);
      banStatus = await banService.getBanStatus(ctx.session!.wallet);
    } catch (error) {
      console.error('Failed to check ban status:', error);
    }

    return { 
      user, 
      banStatus: banStatus?.isBanned ? banStatus : null 
    };
  }),
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.deleteCookie(SESSION_COOKIE_NAME);
    return { success: true };
  }),
});
