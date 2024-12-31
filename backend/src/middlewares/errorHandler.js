import { ApiError } from "../utils/errorHandlingClass.js";
import { apiErrorResponse } from "../utils/response.js";

export const ErrorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    // Logging with controller info
    console.error(`Error in ${req.originalUrl}: ${err.message}`);
    // Custom ApiError response
    return apiErrorResponse(res, err);
  }
  // Unhandled errors (non-ApiError)
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
    status: 500,
  });
};
