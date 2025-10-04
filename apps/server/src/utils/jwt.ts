import jwt, { type SignOptions, type Secret } from "jsonwebtoken";
import { env } from "../config/env";

interface JwtPayloadBase {
  sub: string;
  role: string;
}

export function signAccessToken(payload: JwtPayloadBase) {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign(payload, secret, options);
}

export function signRefreshToken(payload: JwtPayloadBase) {
  const secret: Secret = env.JWT_SECRET;
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"]
  };
  return jwt.sign({ ...payload, type: "refresh" }, secret, options);
}

export function verifyToken<T extends object = JwtPayloadBase>(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload & T;
}
