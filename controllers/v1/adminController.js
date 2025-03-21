const User = require('@/models/User');
const Branch = require('@/models/Branch');
const bcrypt = require('bcrypt');

// create a new branch
const store = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email field is missing' });
    }

    if (req.user.franchise.role !== 'admin') {
      return res.status(403).json({ message: 'Only franchisees can invite admins' });
    }

    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: 'This email already exists as a user in this platform' });
    }

    // create a new user
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
    });

    // add role to user
    newUser.franchise = {
      role: 'user',
      branch: req.user.franchise?.branch,
    };

    await newUser.save();

    // TODO: send email to the user logics

    // send response
    res.json({
      message: 'Successfully added a new admin',
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error' });
  }
};

// send info of a branch
const list = async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'createdAt', search = '' } = req.query;

    // Convert 'page' and 'limit' to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Define the search pattern (case-insensitive)
    const searchPattern = new RegExp(search, 'i'); // 'i' for case-insensitive

    // Define the sort object based on the query parameter
    let sortObject = {};
    if (sort === 'createdAt') {
      sortObject['createdAt'] = -1; // Descending order for createdAt
      // } else if (sort === 'title') {
      //   sortObject['title'] = 1; // Ascending order for title
    } else {
      sortObject = { createdAt: -1 }; // Default sorting by createdAt descending
    }

    // Role-based filtering
    let roleMatch = {};
    if (req.user?.franchise === undefined) {
      // Superadmin: Fetch all proposals
      roleMatch = {};
    } else if (req.user.franchise.role === 'admin') {
      // Admin: Fetch only proposals for his branch
      roleMatch = { 'franchise.branch': req.user.franchise.branch };
    }

    // Aggregate query for search, pagination, and sorting
    const users = await User.aggregate([
      {
        $match: {
          // Match any branch that contains the search string in any of these fields
          franchise: { $exists: true },
          ...roleMatch,
          $or: [
            { 'profile.firstName': searchPattern },
            { 'profile.lastName': searchPattern },
            { 'franchise.role': searchPattern },
          ],
        },
      },
      {
        $sort: sortObject, // Apply the dynamic sort based on the query parameter
      },
      {
        $skip: (pageNumber - 1) * limitNumber, // Skip the documents based on the page number
      },
      {
        $limit: limitNumber, // Limit the number of documents per page
      },
      {
        $project: {
          _id: 1,
          role: '$franchise.role',
          name: {
            $concat: [
              { $ifNull: ['$profile.firstName', ''] },
              ' ',
              { $ifNull: ['$profile.lastName', ''] },
            ],
          },
        },
      },
    ]);

    // Get the total number of matching branches
    const totalUsers = await User.countDocuments({
      franchise: { $exists: true },
      ...roleMatch,
      $or: [
        { 'profile.firstName': searchPattern },
        { 'profile.lastName': searchPattern },
        { 'franchise.role': searchPattern },
      ],
    });

    // Send the response with branches and pagination metadata
    res.status(200).json({
      users,
      pagination: {
        totalLength: totalUsers,
        pageCount: Math.ceil(totalUsers / limitNumber),
        currentPage: pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const destroy = async (req, res) => {};

module.exports = {
  store,
  list,
  destroy,
};
