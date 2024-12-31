// success response utility
export const apiResponse = (res, status, message, data, success = true) => {
  return res.status(status).json({
    message,
    success,
    status,
    data,
  });
};

// Error response utility for ApiError class instances only (from errorHandlingClass.js). this is used for formating error response
export const apiErrorResponse = (res, error) => {
  return res.status(error.statusCode || 500).json({
    message: error.message || "Internal Server Error",
    status: error.statusCode || 500,
    success: false,
    data: error.data || null,
    errors: error.errors || [],
  });
};


// export const apiErrorResponse = (res, status, message, data=null, success = false) => {
//   return res.status(status || 500).json({
//     message,
//     success,
//     status,
//     data,
//   });
// };
