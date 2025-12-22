import { router, protectedProcedure } from "@/server/trpc";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => {
    return {
      id: ctx.user!.id,
      address: ctx.user!.address,
    };
  }),
});


