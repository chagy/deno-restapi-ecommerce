import { Application, config, isHttpError } from "./deps.ts";
import { productsRouter } from "./router/productsRouter.ts";
import { authRouter } from "./router/authRouter.ts";
import { meRouter } from "./router/meRouter.ts";
import { cartRouter } from "./router/cartRouter.ts";
import { addressesRouter } from "./router/addressesRouter.ts";
import { checkoutRouter } from "./router/checkoutRouter.ts";
import { orderRouter } from "./router/orderRouter.ts";
import { adminRouter } from "./router/adminRouter.ts";
import { getRefreshToken } from "./middlewares/getRefreshtoken.ts";
import { errorHandling } from "./middlewares/errorHandling.ts";

const { PORT } = config();

const app = new Application();

app.use(errorHandling);


//Route products
app.use(productsRouter.routes());
app.use(productsRouter.allowedMethods());

//Auth routes
// /auth/signup
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.use(getRefreshToken);

//Me routes (private)
app.use(meRouter.routes());
app.use(meRouter.allowedMethods());

//Carts routes(private)
app.use(cartRouter.routes());
app.use(cartRouter.allowedMethods());

//Addresses routes(private)
app.use(addressesRouter.routes());
app.use(addressesRouter.allowedMethods());

//Checkout routes(private)
app.use(checkoutRouter.routes());
app.use(checkoutRouter.allowedMethods());

//Checkout routes(private)
app.use(orderRouter.routes());
app.use(orderRouter.allowedMethods());

//Route users
app.use(adminRouter.routes());
app.use(adminRouter.allowedMethods());

app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = "Not found";
});

console.log(`The server is staring up at port: ${PORT}`);
await app.listen({ port: +PORT });
