import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/trpc";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

const handler = (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (opts) => createTRPCContext(opts),
    responseMeta({ ctx }) {
      const headers = ctx?.resHeaders;
      if (!headers) return {};
      const headerObj: Record<string, string> = {};
      headers.forEach((value, key) => {
        headerObj[key] = value;
      });
      return { headers: headerObj };
    },
  });
};

export { handler as GET, handler as POST };


