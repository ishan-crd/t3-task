import { z } from "zod";
import { router, publicProcedure } from "@/server/trpc";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { verifyMessage } from "viem";

const NONCE_TTL_MINUTES = 10;
const SESSION_TTL_HOURS = 24;

export const authRouter = router({
  getNonce: publicProcedure
    .input(
      z.object({
        address: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const address = input.address.toLowerCase();
      const nonce = randomBytes(16).toString("hex");
      const expiresAt = new Date(
        Date.now() + NONCE_TTL_MINUTES * 60 * 1000,
      );

      await ctx.db.user.upsert({
        where: { address },
        update: {},
        create: {
          address,
        },
      });

      await ctx.db.session.deleteMany({
        where: {
          user: { address },
          expiresAt: { lt: new Date() },
        },
      });

      // Store nonce in a short-lived session row with a special token prefix.
      await ctx.db.session.create({
        data: {
          token: `nonce-${nonce}`,
          user: {
            connect: { address },
          },
          expiresAt,
        },
      });

      const message = `Sign this message to authenticate.\n\nNonce: ${nonce}`;

      return { message };
    }),

  verifySignature: publicProcedure
    .input(
      z.object({
        address: z.string().min(1),
        message: z.string().min(1),
        signature: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const address = input.address.toLowerCase();

      const valid = await verifyMessage({
        address: address as `0x${string}`,
        message: input.message,
        signature: input.signature as `0x${string}`,
      }).catch(() => false);

      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid signature" });
      }

      const nonceMatch = input.message.match(/Nonce:\s*([a-f0-9]+)/i);
      if (!nonceMatch) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Nonce not found in message" });
      }
      const nonce = nonceMatch[1];

      const nonceSession = await ctx.db.session.findFirst({
        where: {
          token: `nonce-${nonce}`,
          user: { address },
        },
        include: { user: true },
      });

      if (!nonceSession || nonceSession.expiresAt < new Date()) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Nonce expired or not found" });
      }

      // Clean up nonce session
      await ctx.db.session.delete({ where: { id: nonceSession.id } });

      const sessionToken = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);

      await ctx.db.session.create({
        data: {
          token: sessionToken,
          user: {
            connect: { id: nonceSession.userId },
          },
          expiresAt,
        },
      });

      const isProd = process.env.NODE_ENV === "production";
      const cookie = [
        `session-token=${encodeURIComponent(sessionToken)}`,
        "Path=/",
        `Max-Age=${SESSION_TTL_HOURS * 60 * 60}`,
        "HttpOnly",
        "SameSite=Lax",
        isProd ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      ctx.resHeaders.append("Set-Cookie", cookie);

      return {
        success: true,
        address,
      };
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    // Clear cookie on client by setting it expired
    const isProd = process.env.NODE_ENV === "production";
    const expiredCookie = [
      "session-token=deleted",
      "Path=/",
      "Max-Age=0",
      "HttpOnly",
      "SameSite=Lax",
      isProd ? "Secure" : "",
    ]
      .filter(Boolean)
      .join("; ");

    ctx.resHeaders.append("Set-Cookie", expiredCookie);

    return { success: true };
  }),
});


