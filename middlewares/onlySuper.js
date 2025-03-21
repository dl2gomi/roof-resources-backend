const onlySuper = async (req, res, next) => {
  try {
    const role = !req.user.franchise ? 'super' : req.user.franchise.role;
    if (role === 'super') next();
    else return res.status(403).json({ message: 'Only franchisor can access this resouce' });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = onlySuper;
