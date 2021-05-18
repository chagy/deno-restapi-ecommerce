import { RouterMiddleware } from "../deps.ts";

import { Role } from '../types/types.ts';

import { verifyAccessToken } from "../utils/tokens.ts";

export const isAuthorized = (permissions: Role[]): RouterMiddleware => async (ctx, next) => {
  const { request } = ctx;
  if (!request.user) {
    ctx.throw(401);
    return;
  }

  const hasPermission = permissions.includes(request.user.role)

  if (!hasPermission) {
    ctx.throw(403)
    return
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
