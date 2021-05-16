import { Router } from "../deps.ts";

import { isAuthenticated } from "../middlewares/isAuthenticated.ts";
import { isAuthorized } from "../middlewares/isAuthorized.ts";
import { myProfile, signout } from "../controllers/me.ts";

export const meRouter = new Router({ prefix: "/me" });

meRouter.get("/", isAuthenticated, isAuthorized, myProfile);
meRouter.post("/signout", isAuthenticated, isAuthorized, signout);
