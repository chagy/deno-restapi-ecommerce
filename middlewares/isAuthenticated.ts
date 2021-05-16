import { RouterMiddleware } from "../deps.ts";

import { runQuery } from "../db/db.ts";
import { fetchSessionById, fetchUserById } from "../db/query.ts";

import { User } from "../types/types.ts";

export const isAuthenticated: RouterMiddleware = async (ctx, next) => {
  const { request } = ctx;

  if (!request.sessionId) {
    ctx.throw(401, "Please sign in to proceed");
    return;
  }

  const result = await runQuery<{ id: string; owner_id: string }>(
    fetchSessionById(request.sessionId),
  );
  const session = result.rows[0];

  if (!session) {
    ctx.throw(401);
    return;
  }

  const fetchUserResult = await runQuery<User>(fetchUserById(session.owner_id));
  const user = fetchUserResult.rows[0];

  if (!user) {
    ctx.throw(401);
    return;
  }

  request.user = user;

  await next();
};
