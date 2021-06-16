import { bcrypt, RouterMiddleware, v4 } from "../deps.ts";
import { sendEmail, validateEmail } from "../utils/helpers.ts";
import {
  editUserResetToken,
  fetchUserByEmail,
  insertSession,
  insertUser,
  fetchUserByToken, editUserNewPassword
} from "../db/query.ts";
import { runQuery } from "../db/db.ts";
import { User } from "../types/types.ts";
import {
  createAccessToken,
  createRefreshToken,
  setRefreshToken,
} from "../utils/tokens.ts";

export const signup: RouterMiddleware = async (ctx) => {
  try {
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

    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail),
    );
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

    const insertSessionResult = await runQuery<
      { id: string; owner_id: string }
    >(
      insertSession(newUser.id),
    );
    const session = insertSessionResult.rows[0];

    if (!session) {
      ctx.throw(500);
    }

    const refreshToken = await createRefreshToken(session.id);

    setRefreshToken(refreshToken, cookies);

    const accessToken = await createAccessToken(session.id, newUser.id);

    response.body = { message: "You have successfully signed up", accessToken, user: newUser };
  } catch (error) {
    throw error;
  }
};

export const signin: RouterMiddleware = async (ctx) => {
  try {
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

    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail),
    );
    const user = fetchUserResult.rows[0];

    if (!user) {
      ctx.throw(400, "User not found,please sign up instead.");
    }

    if (user.reset_password_token) {
      ctx.throw(400, 'Please reset your password')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      ctx.throw(400, "Email or password is invalid.");
    }

    const insertSessionResult = await runQuery<
      { id: string; owner_id: string }
    >(
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
  } catch (error) {
    throw error;
  }
};

export const resetPassword: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx;

    const hasBody = request.hasBody;

    if (!hasBody) {
      ctx.throw(400, "Please all required information");
    }

    const body = request.body();

    if (body.type !== "json") {
      ctx.throw(400);
    }

    const { email } = await body.value as {
      email: string;
    };

    if (!email) {
      ctx.throw(400, "Please provide all required information.");
    }

    const formatedEmail = email.trim().toLowerCase();

    const fetchUserResult = await runQuery<User>(
      fetchUserByEmail(formatedEmail),
    );
    const user = fetchUserResult.rows[0];

    if (!user) {
      ctx.throw(400, "User not found,please sign up instead.");
    }

    const resetPasswordToken = v4.generate();
    const expiration = Date.now() + 1000 * 60 * 30;

    const updateUserResult = await runQuery(
      editUserResetToken({
        id: user.id,
        reset_password_token: resetPasswordToken,
        reset_password_token_expiry: expiration,
      }),
    );

    const updatedUser = updateUserResult.rows[0];
    if (!updatedUser) {
      ctx.throw(500);
    }

    const subject = "Reset your password";
    const html = `
      <div style={{width: '60%'}}>
        <p>Please click the link below to reset your password.</p> \n\n
        <a href='http://localhost:5000?resetToken=${resetPasswordToken}' target='blank' style={{color: 'blue' }}>
          Click to reset password
        </a>
      </div>
    `;

    const sendEmailResult = await sendEmail(
      email,
      user.username,
      subject,
      html,
    );

    if (sendEmailResult.status !== 202) {
      ctx.throw(500);
      return;
    }

    response.body = {
      message: "Please check your email to confirm your reset password",
    };
  } catch (error) {
    throw error;
  }
};

export const confirmResetPassword: RouterMiddleware = async (ctx) => {
  try {
    const { request, response } = ctx;

    const hasBody = request.hasBody;

    if (!hasBody) {
      ctx.throw(400, "Please all required information");
    }

    const body = request.body();

    if (body.type !== "json") {
      ctx.throw(400);
    }

    const { password, resetPasswordToken } = await body.value as {
      password: string;
      resetPasswordToken: string;
    };

    if (!password || !resetPasswordToken) {
      ctx.throw(400, "Please provide all required information.");
    }

    if (password.length < 6) {
      ctx.throw(400, 'Password must be at least 6 characters')
    }

    const fetchUserResult = await runQuery<User>(
      fetchUserByToken(resetPasswordToken),
    );
    const user = fetchUserResult.rows[0];

    if (!user) {
      ctx.throw(400);
      return
    }

    const isTokenValid = user.reset_password_token_expiry && user.reset_password_token_expiry > Date.now()

    if (!isTokenValid) {
      ctx.throw(400)
      return
    }

    const isPasswordNotChanged = await bcrypt.compare(password, user.password)
    if (isPasswordNotChanged) {
      ctx.throw(400, 'Using the old password is not allowed')
      return
    }

    const hashedPassword = await bcrypt.hash(password)

    const updateUserResult = await runQuery<User>(editUserNewPassword({ id: user.id, password: hashedPassword }))
    const updatedUser = updateUserResult.rows[0]

    if (!updatedUser) {
      ctx.throw(500)
      return
    }

    response.body = {
      message: "You have successfully reset your password.",
    };
  } catch (error) {
    throw error;
  }
};