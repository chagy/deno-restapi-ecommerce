import { RouterMiddleware } from "../deps.ts";

import { verifyAccessToken } from "../utils/tokens.ts";

export const isAuthorized: RouterMiddleware = async (ctx, next) => {
  const { request } = ctx;
  if (!request.user) {
    ctx.throw(401);
    return;
  }

  const authorization = request.headers.get("authorization");
  const accessToken = authorization
    ? authorization.split(" ")[1]
    : authorization;

  if (!accessToken) {
    ctx.throw(401);
    return;
  }

  const accessPayload = await verifyAccessToken(accessToken);

  if (!accessPayload) {
    ctx.throw(401);
    return;
  }

  if (accessPayload.userId !== request.user.id) {
    ctx.throw(401);
    return;
  }

  await next();
};
