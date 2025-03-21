const resEnhancer = (req, res, next) => {
  const originalJson = res.json;

  res.json = function (body) {
    // Set default structure
    const responseBody = {
      success: res.statusCode >= 200 && res.statusCode < 300, // success based on status code
      message: body.message || '', // message, fallback to empty string
      data: {
        ...body,
        message: undefined,
      },
    };

    // Call the original res.json with the modified body
    return originalJson.call(this, responseBody);
  };

  next();
};

module.exports = resEnhancer;
