import { Router } from "../deps.ts";
import { signin, signup } from "../controllers/auth.ts";

export const authRouter = new Router({ prefix: "/auth" });

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.post("/reset-password", () => {});
authRouter.post("/confirm-reset-password", () => {});
