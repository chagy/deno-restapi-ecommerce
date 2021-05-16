import { bcrypt, RouterMiddleware } from "../deps.ts";
import { validateEmail } from "../utils/helpers.ts";
import { fetchUserByEmail, insertSession, insertUser } from "../db/query.ts";
import { runQuery } from "../db/db.ts";
import { User } from "../types/types.ts";
import {
  createAccessToken,
  createRefreshToken,
  setRefreshToken,
} from "../utils/tokens.ts";

export const signup: RouterMiddleware = async (ctx) => {
  const { request, response, cookies } = ctx;

  const hasBody = request.hasBody;

  if (!hasBody) {
    ctx.throw(400, "Please all required information");
  }

  const body = request.body();

  if (body.type !== "json") {
    ctx.throw(400);
  }
  const { username, email, password } = await body.value as {
    username: string;
    email: string;
    password: string;
  };

  if (!username || !email || !password) {
    ctx.throw(400);
  }

  const formatedUsername = username.trim();

  if (formatedUsername.length < 3) {
    ctx.throw(400, "Username must be at least 3 characters.");
  }

  const formatedEmail = email.trim().toLowerCase();

  if (!validateEmail(formatedEmail)) {
    ctx.throw(400, "Email is invalid");
  }

  if (password.length < 6) {
    ctx.throw(400, "Password must be least 6 characters");
  }

  const fetchUserResult = await runQuery<User>(fetchUserByEmail(formatedEmail));
  const user = fetchUserResult.rows[0];

  if (user) {
    ctx.throw(400, "The email is already in use.");
  }

  const hashedPassword = await bcrypt.hash(password);

  const insertUserResult = await runQuery<User>(
    insertUser({
      username: formatedUsername,
      email: formatedEmail,
      password: hashedPassword,
    }),
  );

  const newUser = insertUserResult.rows[0];

  if (!newUser) {
    ctx.throw(500);
  }

  const insertSessionResult = await runQuery<{ id: string; owner_id: string }>(
    insertSession(newUser.id),
  );
  const session = insertSessionResult.rows[0];

  if (!session) {
    ctx.throw(500);
  }

  const refreshToken = await createRefreshToken(session.id);

  setRefreshToken(refreshToken, cookies);

  const accessToken = await createAccessToken(session.id, newUser.id);

  response.body = { message: "You have successfully signed up", accessToken };
};

export const signin: RouterMiddleware = async (ctx) => {
  const { request, response, cookies } = ctx;

  const hasBody = request.hasBody;

  if (!hasBody) {
    ctx.throw(400, "Please all required information");
  }

  const body = request.body();

  if (body.type !== "json") {
    ctx.throw(400);
  }

  const { email, password } = await body.value as {
    email: string;
    password: string;
  };

  if (!email || !password) {
    ctx.throw(400, "Please provide all required information.");
  }

  const formatedEmail = email.trim().toLowerCase();

  const fetchUserResult = await runQuery<User>(fetchUserByEmail(formatedEmail));
  const user = fetchUserResult.rows[0];

  if (!user) {
    ctx.throw(400, "User not found,please sign up instead.");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    ctx.throw(400, "Email or password is invalid.");
  }

  const insertSessionResult = await runQuery<{ id: string; owner_id: string }>(
    insertSession(user.id),
  );
  const session = insertSessionResult.rows[0];

  if (!session) {
    ctx.throw(500);
  }

  const refreshToken = await createRefreshToken(session.id);

  setRefreshToken(refreshToken, cookies);

  const accessToken = await createAccessToken(session.id, user.id);

  response.body = { message: "You are logged in", accessToken };
};
