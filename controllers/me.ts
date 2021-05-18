import { RouterMiddleware } from "../deps.ts";

import { runQuery } from "../db/db.ts";
import { removeSessionById, insertSession } from "../db/query.ts";
import { deleteToken, handleTokens } from "../utils/tokens.ts";

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

export const renewAccessToken: RouterMiddleware = async (ctx) => {
  try {
    const { request, cookies, response } = ctx

    if (!request.user || !request.sessionId) {
      ctx.throw(401)
      return
    }

    const insertSessionResult = await runQuery<{ id: string; owner_id: string }>(insertSession(request.user.id))
    const newSession = insertSessionResult.rows[0]

    if (!newSession) {
      ctx.throw(500)
      return
    }

    const accessToken = await handleTokens(newSession.id, newSession.owner_id, cookies)

    await runQuery(removeSessionById(request.sessionId))

    response.body = { accessToken }
  } catch (error) {
    throw error
  }
}
