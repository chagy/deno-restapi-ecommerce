import { RouterMiddleware } from "../deps.ts";

export const myProfile: RouterMiddleware = (ctx) => {
  const { request, response } = ctx;
  console.log("user: ", request.user);

  response.body = { user: request.user };
};
