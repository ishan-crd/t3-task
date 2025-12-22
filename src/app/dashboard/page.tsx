"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/utils/trpc";

export default function DashboardPage() {
  const router = useRouter();
  const meQuery = api.user.me.useQuery(undefined, {
    retry: false,
  });
  const postsQuery = api.post.list.useQuery(undefined, {
    enabled: meQuery.data != null,
  });
  const createPost = api.post.create.useMutation({
    onSuccess: async () => {
      await postsQuery.refetch();
      setTitle("");
      setContent("");
    },
  });
  const logout = api.auth.logout.useMutation({
    onSuccess: async () => {
      await meQuery.refetch();
      router.push("/login");
    },
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  type UserPost = NonNullable<typeof postsQuery.data>[number];

  if (meQuery.isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-50">
        <p className="text-sm text-slate-300">Checking your session...</p>
      </main>
    );
  }

  if (meQuery.error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-50">
        <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-slate-900/70 p-6">
          <p className="text-sm font-medium text-red-300">
            You are not authenticated.
          </p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  const user = meQuery.data!;

  return (
    <main className="flex min-h-screen justify-center bg-slate-950 px-4 py-10 text-slate-50">
      <div className="w-full max-w-3xl space-y-6">
        <header className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Dashboard
            </p>
            <p className="mt-1 text-sm text-slate-200">
              Logged in as{" "}
              <span className="font-mono text-emerald-300">
                {user.address}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-medium text-slate-100 hover:border-red-400/70 hover:text-red-200"
          >
            Logout
          </button>
        </header>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-sm font-semibold tracking-tight">
            Create a post
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Using <span className="font-mono">post.create</span>
          </p>

          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              createPost.mutate({ title, content });
            }}
          >
            <input
              className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:ring-2"
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="h-24 w-full resize-none rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/60 placeholder:text-slate-500 focus:ring-2"
              placeholder="Write something..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <button
              type="submit"
              disabled={
                !title ||
                !content ||
                createPost.isPending ||
                postsQuery.isLoading
              }
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPost.isPending ? "Creating..." : "Create Post"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-white/10 bg-slate-900/80 p-6">
          <h2 className="text-sm font-semibold tracking-tight">
            Your posts
          </h2>
          <p className="mt-1 text-xs text-slate-300">
            Using <span className="font-mono">post.list</span>
          </p>

          {postsQuery.isLoading ? (
            <p className="mt-4 text-sm text-slate-300">Loading posts...</p>
          ) : postsQuery.data && postsQuery.data.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {postsQuery.data.map((post: UserPost) => (
                <li
                  key={post.id}
                  className="rounded-lg border border-white/10 bg-slate-950/50 p-3"
                >
                  <p className="text-sm font-medium text-slate-50">
                    {post.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    {post.content}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-300">
              No posts yet. Create your first one above.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}


