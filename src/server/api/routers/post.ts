import { z } from "zod";
import { router, protectedProcedure } from "@/server/trpc";

export const postRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(100),
        content: z.string().min(1).max(1000),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.db.post.create({
        data: {
          title: input.title,
          content: input.content,
          userId: ctx.user!.id,
        },
      });

      return post;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const posts = await ctx.db.post.findMany({
      where: { userId: ctx.user!.id },
      orderBy: { createdAt: "desc" },
    });

    return posts;
  }),
});


