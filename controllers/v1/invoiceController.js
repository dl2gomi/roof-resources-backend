const Branch = require('@/models/Branch');
const Proposal = require('@/models/Proposal');
const Invoice = require('@/models/Invoice');

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
      // } else if (sort === 'title') {
      //   sortObject['title'] = 1; // Ascending order for title
    } else {
      sortObject = { createdAt: -1 }; // Default sorting by createdAt descending
    }

    // Role-based filtering
    let roleMatch = {};
    if (req.user?.franchise === undefined) {
      // Superadmin: No restrictions
      roleMatch = {};
    } else if (req.user.franchise.role === 'admin') {
      // Admin: Only invoices where proposal belongs to their branch
      roleMatch = { 'proposalDetails.branch': req.user.franchise.branch };
    } else if (req.user.franchise.role === 'user') {
      // User: Only invoices where proposal was created by them
      roleMatch = { 'proposalDetails.user': req.user._id };
    }

    // Aggregate query for search, pagination, and sorting
    const invoices = await Invoice.aggregate([
      {
        $lookup: {
          from: 'proposals',
          localField: 'proposal',
          foreignField: '_id',
          as: 'proposalDetails',
        },
      },
      {
        $unwind: { path: '$proposalDetails', preserveNullAndEmptyArrays: true }, // Unwind the owner details
      },
      {
        $match: {
          // Match any branch that contains the search string in any of these fields
          ...roleMatch,
          $or: [
            { 'proposalDetails.customer.name': searchPattern },
            { 'proposalDetails.customer.address': searchPattern },
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
          name: '$proposalDetails.customer.name',
          address: '$proposalDetails.customer.address',
          paidAt: 1,
        },
      },
    ]);

    // Get the total number of matching invoices
    const totalInvoices = await Invoice.aggregate([
      {
        $lookup: {
          from: 'proposals',
          localField: 'proposal',
          foreignField: '_id',
          as: 'proposalDetails',
        },
      },
      { $unwind: { path: '$proposalDetails', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          ...roleMatch,
          $or: [
            { 'proposalDetails.customer.name': searchPattern },
            { 'proposalDetails.customer.address': searchPattern },
          ],
        },
      },
      { $count: 'total' },
    ]);
    const totalLength = totalInvoices.length > 0 ? totalInvoices[0].total : 0;

    // Send response
    return res.status(200).json({
      invoices,
      pagination: {
        totalLength,
        pageCount: Math.ceil(totalLength / limitNumber),
        currentPage: totalLength === 0 ? 1 : pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = {
  show,
  list,
};
