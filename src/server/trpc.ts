import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "./db";

export type SessionUser = {
  id: string;
  address: string;
};

export type Context = {
  db: typeof db;
  user: SessionUser | null;
  resHeaders: Headers;
};

export const createTRPCContext = async (
  opts: FetchCreateContextFnOptions,
): Promise<Context> => {
  const { req } = opts;
  const resHeaders = new Headers();

  const cookieHeader = req.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((c) => c.trim())
      .filter(Boolean)
      .map((c) => {
        const [key, ...rest] = c.split("=");
        return [key, decodeURIComponent(rest.join("="))];
      }),
  );

  const sessionToken = cookies["session-token"];
  let user: SessionUser | null = null;

  if (sessionToken) {
    const session = await db.session.findUnique({
      where: { token: sessionToken },
      include: { user: true },
    });

    if (session && session.expiresAt > new Date()) {
      user = {
        id: session.user.id,
        address: session.user.address,
      };
    }
  }

  return {
    db,
    user,
    resHeaders,
  };
};

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

export const createCallerFactory = t.createCallerFactory;
export const router = t.router;
export const publicProcedure = t.procedure;

const enforceUser = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUser);


