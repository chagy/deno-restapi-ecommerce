import { RouterMiddleware } from "../deps.ts";

import { runQuery } from "../db/db.ts";
import { removeSessionById } from "../db/query.ts";
import { deleteToken } from "../utils/tokens.ts";

export const myProfile: RouterMiddleware = (ctx) => {
  const { request, response } = ctx;
  console.log("user: ", request.user);

  response.body = { user: request.user };
};

export const signout: RouterMiddleware = async (ctx) => {
  try {
    const { request, response, cookies } = ctx;

    if (!request.sessionId) {
      ctx.throw(401);
      return;
    }

    await runQuery(removeSessionById(request.sessionId));

    deleteToken(cookies);

    response.body = { message: "You are logged out." };
  } catch (error) {
    throw error;
  }
};
