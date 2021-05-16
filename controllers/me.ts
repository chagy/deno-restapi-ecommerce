import { RouterMiddleware } from "../deps.ts";

export const myProfile: RouterMiddleware = (ctx) => {
  const { response } = ctx;

  response.body = { user: "This is your profile" };
};
