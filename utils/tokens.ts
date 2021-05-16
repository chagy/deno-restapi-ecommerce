import {
  config,
  Cookies,
  create,
  getNumericDate,
  Header,
  Payload,
  verify,
} from "../deps.ts";

const { TK_REFRESH_KEY, TK_ACCESS_KEY, TK_NAME } = config();

const header: Header = {
  alg: "HS256",
  typ: "JWT",
};

export const createRefreshToken = (sessionId: string) => {
  const payload: Payload = {
    sessionId,
    exp: getNumericDate(60 * 60 * 24 * 7),
  };
  return create(header, payload, TK_REFRESH_KEY);
};

export const createAccessToken = (sessionId: string, userId: string) => {
  const payload: Payload = {
    sessionId,
    userId,
    exp: getNumericDate(60 * 5),
  };
  return create(header, payload, TK_ACCESS_KEY);
};

export const setRefreshToken = (token: string, cookies: Cookies) =>
  cookies.set(TK_NAME, token, { httpOnly: true });

export const verifyRefreshToken = async (refreshToken: string) => {
  try {
    const payload = await verify(refreshToken, TK_REFRESH_KEY, "HS256") as {
      sessionId: string;
      exp: number;
    };
    return payload;
  } catch (error) {
  }
};
