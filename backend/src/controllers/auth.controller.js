import { generateTokens, setTokensInCookie } from "../utils/generateTokens.js";
import UserModel from "../models/user.model.js";
import redisClient from "../lib/redis.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { apiResponse } from "../utils/response.js";
import { ApiError } from "../utils/errorHandlingClass.js";
import { asyncHandler } from "../utils/asyncHandler.js";
dotenv.config();

export const registerUser = asyncHandler(async (req, res) => {
  const {
    fullname,
    username,
    email,
    password,
    confirmPassword,
    gender,
    avatar,
  } = req.body;

  // Check for empty fields
  if (
    !fullname ||
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !gender
  ) {
    throw new ApiError(400, "All fields are required", [
      { message: "All fields are required" },
    ]);
  }

  // Check for password match
  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match", [
      { message: "Password and Confirm Password do not match" },
    ]);
  }

  // Check for password strength
  const passwordRegex = new RegExp(
    "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$"
  );
  if (!passwordRegex.test(password)) {
    throw new ApiError(400, "Weak password", [
      {
        message:
          "Password must contain at least 6 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
      },
    ]);
  }

  // Check for existing user
  const user = await UserModel.findOne({ email });
  if (user) {
    throw new ApiError(400, "User already exists with this email", [
      { message: "Email is already registered " },
    ]);
  }

  // Create new user
  const newUser = new UserModel({
    fullname,
    username,
    email,
    password,
    gender,
    avatar,
  });

  // Save user
  await newUser.save();

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(newUser);

  // Set refresh token in Redis
  await redisClient.set(refreshToken, newUser._id, "EX", 60 * 60 * 24 * 30); // 30 days expiry

  // Set tokens in cookies
  setTokensInCookie(res, accessToken, refreshToken);

  // Send successful response
  apiResponse(res, 201, "User registered successfully", {
    user: { fullname, username, email, gender, avatar },
  });
});
export const loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Check for empty fields
  if (!email || !password) {
    throw new ApiError(400, "All fields are required", [
      { message: "Email and password are required" },
    ]);
  }

  // Check for existing user
  const user = await UserModel.findOne({ email });
  if (!user) {
    throw new ApiError(400, "User not found", [
      {
        message: "User not registered with this email",
        error: "User not found",
      },
    ]);
  }

  // Check for password match
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials", [
      { message: "Invalid email or password", error: "Invalid credentials" },
    ]);
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateTokens(user);

  // Set refresh token in Redis
  await redisClient.set(refreshToken, user._id, "EX", 60 * 60 * 24 * 30); // 30 days expiry

  // Set tokens in cookies
  setTokensInCookie(res, accessToken, refreshToken);

  // Send successful response with user data
  apiResponse(res, 200, "User logged in successfully", {
    user: {
      id: user._id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      gender: user.gender,
      avatar: user.avatar,
    },
  });
});
export const logoutUser = asyncHandler(async (req, res) => {
  const { accessToken, refreshToken } = req.cookies;

  // Check if the tokens are present in the cookies
  if (!accessToken || !refreshToken) {
    throw new ApiError(401, "User not authenticated", [
      { message: "Access token or refresh token is missing" },
    ]);
  }

  try {
    // Verify access token
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

    // Remove refresh token from Redis
    await redisClient.del(refreshToken);

    // Clear cookies
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");

    // Send success response
    res.status(200).json({
      message: "User logged out successfully",
      success: true,
    });
  } catch (error) {
    // Catch errors and throw them as ApiError
    throw new ApiError(500, "Error in Logout Controller", [
      { message: error.message },
    ]);
  }
});

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // verify refresh token
    const { userId } = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // generate new access token
    const user = await UserModel.findById(userId);
    const { accessToken } = await generateTokens(user);

    // set refresh token in redis

    // set tokens in cookie
    setTokensInCookie(res, accessToken);

    res.status(200).json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Error in refreshToken: ", error);
    res.status(500).json({ error: error.message });
  }
};

export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found", [{ message: "User not found" }]);
  }
  apiResponse(res, 200, "User profile fetched successfully", { user });
});

export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await UserModel.findByIdAndUpdate(req.user._id, req.body, {
    new: true,
    runValidators: true,
  });
  apiResponse(res, 200, "User profile updated successfully", { user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await UserModel.findById(req.user._id).select("+password");
  if (!user) {
    throw new ApiError(404, "User not found", [{ message: "User not found" }]);
  }

  const isMatch = await user.comparePassword(req.body.currentPassword);
  if (!isMatch) {
    throw new ApiError(400, "Invalid credentials", [
      { message: "Invalid current password" },
    ]);
  }

  if (req.body.currentPassword === req.body.newPassword) {
    throw new ApiError(400, "New password is same as old password", [
      { message: "New password is same as old password" },
    ]);
  }

  user.password = req.body.newPassword;
  await user.save();
  apiResponse(res, 200, "Password changed successfully", { user });
});

