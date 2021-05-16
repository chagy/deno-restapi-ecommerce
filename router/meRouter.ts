import { Router } from "../deps.ts";

import { myProfile } from "../controllers/me.ts";

export const meRouter = new Router({ prefix: "/me" });

meRouter.get("/", myProfile);
