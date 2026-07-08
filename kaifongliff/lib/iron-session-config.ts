import { SessionOptions } from "iron-session";

export interface SessionData {
  userId?: string;
  lineUserId?: string;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "kaifong_liff_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  },
};