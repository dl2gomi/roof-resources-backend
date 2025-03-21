const User = require('@/models/User');
const Branch = require('@/models/Branch');
const bcrypt = require('bcrypt');

// create a new branch
const store = async (req, res) => {
  const { email, title, firstName, lastName } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: 'This email already exists as a user in this platform.' });
    }

    // create a new user
    const hashedPassword = await bcrypt.hash(process.env.DEFAULT_PASSWORD, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      profile: {
        firstName,
        lastName,
      },
    });

    await newUser.save();

    // create a new branch
    const newBranch = new Branch({
      title,
      owner: newUser._id,
    });

    await newBranch.save();

    // add role to user
    newUser.franchise = {
      role: 'admin',
      branch: newBranch._id,
    };

    await newUser.save();

    // TODO: send email to the user logics

    // send response
    res.json({
      id: newBranch._id,
      message: 'Successfully created a new branch',
      title,
      email,
      firstName,
      lastName,
    });
  } catch (error) {
    console.log('Error while creating branch...', error);
    res.status(500).json({ message: 'Internal Server error' });
  }
};

// update a branch
const update = async (req, res) => {
  const { title, merchantId, address, isActive } = req.body;
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Branch for update is not specified' });
    }

    const branch = await Branch.findById(id);
    if (!branch) {
      return res.status(404).json({ message: 'Specified branch does not exist' });
    }

    // update
    if (title) branch.title = title;
    if (address) branch.address = address;
    if (merchantId) branch.merchantId = merchantId;
    if (isActive !== undefined && isActive !== null) branch.isActive = isActive;

    await branch.save();

    // TODO: send email to the user logics

    // send response
    res.json({
      message: 'Successfully updated the branch',
      id,
      title,
      address,
      merchantId,
      isActive,
    });
  } catch (error) {
    console.log('Error while updating branch...', error);
    res.status(500).json({ message: 'Internal Server error' });
  }
};

// send info of a branch
const show = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Branch is not specified' });
    }

    const branch = await Branch.findById(id).populate('owner');

    if (!branch) {
      return res.status(404).json({ message: 'Specified branch does not exist' });
    }

    // send response
    res.json({
      title: branch.title,
      address: branch.address,
      merchantId: branch.merchantId,
      isActive: branch.isActive,
      createdAt: branch.createdAt,
      owner: {
        email: branch.owner.email,
        fistName: branch.owner.profile?.firstName,
        lastName: branch.owner.profile?.lastName,
        avatar: branch.owner.profile?.avatar,
        phone: branch.owner.profile?.phone,
      },
    });
  } catch (error) {
    console.log('Error while getting info of branch...', error);
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
    } else if (sort === 'title') {
      sortObject['title'] = 1; // Ascending order for title
    } else {
      sortObject = { createdAt: -1 }; // Default sorting by createdAt descending
    }

    // Aggregate query for search, pagination, and sorting
    const branches = await Branch.aggregate([
      {
        $lookup: {
          from: 'users', // Join with the 'users' collection
          localField: 'owner', // The field in 'branches' (ref: 'User')
          foreignField: '_id', // The field in 'users' collection
          as: 'ownerDetails', // Alias for joined users
        },
      },
      {
        $unwind: { path: '$ownerDetails', preserveNullAndEmptyArrays: true }, // Unwind the owner details
      },
      {
        $match: {
          // Match any branch that contains the search string in any of these fields
          $or: [
            { title: searchPattern },
            { address: searchPattern },
            { 'ownerDetails.firstName': searchPattern },
            { 'ownerDetails.lastName': searchPattern },
            { merchantId: searchPattern },
            { 'ownerDetails.phone': searchPattern },
            { 'ownerDetails.email': searchPattern },
          ],
        },
      },
      {
        $sort: sortObject, // Apply the dynamic sort based on the query parameter
      },
      {
        $skip: pageNumber === 0 ? 0 : (pageNumber - 1) * limitNumber, // Skip the documents based on the page number
      },
      {
        $limit: limitNumber, // Limit the number of documents per page
      },
      {
        $project: {
          _id: 1,
          title: 1,
          address: 1,
          isActive: 1,
          ownerName: {
            $concat: ['$ownerDetails.profile.firstName', ' ', '$ownerDetails.profile.lastName'],
          },
        },
      },
    ]);

    // Get the total number of matching branches
    const totalBranches = await Branch.countDocuments({
      $or: [
        { title: searchPattern },
        { address: searchPattern },
        { 'ownerDetails.firstName': searchPattern },
        { 'ownerDetails.lastName': searchPattern },
        { merchantId: searchPattern },
        { 'ownerDetails.phone': searchPattern },
        { 'ownerDetails.email': searchPattern },
      ],
    });

    // Send the response with branches and pagination metadata
    res.status(200).json({
      branches,
      pagination: {
        totalLength: totalBranches,
        pageCount: Math.ceil(totalBranches / limitNumber),
        currentPage: totalBranches === 0 ? 1 : pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    console.error('Error retrieving branches:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const destroy = async (req, res) => {};

module.exports = {
  store,
  update,
  show,
  list,
  destroy,
};
