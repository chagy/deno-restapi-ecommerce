import { config, Middleware } from "../deps.ts";

import { verifyRefreshToken } from "../utils/tokens.ts";

const { TK_NAME } = config();

export const getRefreshToken: Middleware = async (ctx, next) => {
  const { request, cookies } = ctx;

  const token = cookies.get(TK_NAME);

  if (token) {
    const refreshPayload = await verifyRefreshToken(token);

    if (refreshPayload) {
      request.sessionId = refreshPayload.sessionId;
    }
  }

  await next();
};
