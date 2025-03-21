const User = require('@/models/User');
const Branch = require('@/models/Branch');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({
      message: 'Logged in successfully',
      email: user.email,
      name: `${user.profile?.firstName} ${user.profile?.lastName}`,
      role: !user.franchise ? 'super' : user.franchise.role,
      token,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error' });
  }
};

const info = async (req, res) => {
  try {
    const branch = await Branch.findById(req.user.franchise?.branch);

    return res.json({
      role: !req.user.franchise ? 'super' : req.user.franchise.role,
      title: branch?.title,
      firstName: req.user.profile?.firstName,
      lastName: req.user.profile?.lastName,
      address: req.user.franchise?.role === 'admin' ? branch?.address : undefined,
      email: req.user.email,
      phone: req.user.profile?.phone,
      merchantId: branch?.merchantId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error' });
  }
};

const update = async (req, res) => {
  try {
    const { first, last, phone, mid, address } = req.body;

    if (!first || !last || !phone) {
      return res.status(400).json({
        message: 'Some fields are missing',
      });
    }

    if (req.user.franchise?.role === 'admin' && (!mid || !address)) {
      return res.status(400).json({
        message: 'Some fields are missing',
      });
    }

    const branch = await Branch.findById(req.user.franchise?.branch);

    if (!req.user.profile) req.user.profile = {};
    req.user.profile.firstName = first;
    req.user.profile.lastName = last;
    req.user.profile.phone = phone;

    if (req.user.franchise?.role === 'admin') {
      branch.merchantId = mid;
      branch.address = address;

      await branch.save();
    }

    await req.user.save();

    return res.json({
      message: 'Successfully updated profile',
      role: !req.user.franchise ? 'super' : req.user.franchise.role,
      title: branch?.title,
      firstName: req.user.profile?.firstName,
      lastName: req.user.profile?.lastName,
      address: req.user.franchise?.role === 'admin' ? branch?.address : undefined,
      email: req.user.email,
      phone: req.user.profile?.phone,
      merchantId: branch?.merchantId,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error' });
  }
};

const change = async (req, res) => {
  try {
    const { oldPassword, newPassword, confPassword } = req.body;

    if (newPassword !== confPassword) {
      return res.status(400).json({
        message: `Password confirmation doesn't match`,
      });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid current password' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({
      message: 'Successfully changed password',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server error' });
  }
};

module.exports = {
  login,
  info,
  update,
  change,
};
