
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export const generateTokens = async (user) => {
  const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRE,
  });
  const refreshToken = jwt.sign({ userId: user._id }, process.env.JWT_REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRE,
  });

  return {
    accessToken,
    refreshToken,
  };
};

export const setTokensInCookie = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRE) * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
    maxAge: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRE) * 1000,
  });
};
