const Branch = require('@/models/Branch');
const Proposal = require('@/models/Proposal');
const Invoice = require('@/models/Invoice');

const { calculateProjectFee } = require('@/helpers');

// create a new proposal
const store = async (req, res) => {
  try {
    const { customer, pricing, detail, options } = req.body;
    const branch = await Branch.findById(req.user.franchise?.branch);
    const user = req.user;

    // create a new proposal
    const newProposal = new Proposal({
      user,
      branch,
      customer,
      pricing,
      detail,
      options,
    });

    await newProposal.save();

    const link = `${process.env.PAYMENT_LINK}/${btoa(newProposal._id.toString())}`;
    const mailBody = `Hi ${customer.name},
    
Thank you for considering The Roof Resource for your roofing needs! We’ve prepared your personalized quote, and you can review all the details and complete your purchase online with just a few clicks.

Click the link below to view your custom quote:
${link}

This quote includes everything you need to get started:
✅ Transparent pricing – no hidden fees
✅ High-quality materials sourced directly
✅ Easy online approval & payment

If you have any questions or need assistance, feel free to reply to this email or call us at ${req.user.profile.phone}. We’re here to help!
Looking forward to helping you with your new roof.
Best,

${req.user.profile.firstName} ${req.user.profile.lastName} 
The Roof Resource Team
${req.user.profile.phone} | ${req.user.email}
    `;

    // TODO: send email to the user logics

    // send response
    return res.json({
      message: 'Successfully created a new proposal. Please send it to the customer and confirm it',
      mailBody,
      id: newProposal._id,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server error' });
  }
};

const mail = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Proposal for confirming send is not specified' });
    }

    const proposal = await Proposal.findById(id).populate('user');

    if (!proposal) {
      return res.status(404).json({ message: 'Specified proposal does not exist' });
    }

    const link = `${process.env.PAYMENT_LINK}/${btoa(proposal._id.toString())}`;
    const mailBody = `Hi ${proposal.customer.name},

Thank you for considering The Roof Resource for your roofing needs! We’ve prepared your personalized quote, and you can review all the details and complete your purchase online with just a few clicks.

Click the link below to view your custom quote:
${link}

This quote includes everything you need to get started:
✅ Transparent pricing – no hidden fees
✅ High-quality materials sourced directly
✅ Easy online approval & payment

If you have any questions or need assistance, feel free to reply to this email or call us at ${proposal.user.profile.phone}. We’re here to help!
Looking forward to helping you with your new roof.
Best,

${proposal.user.profile.firstName} ${proposal.user.profile.lastName} 
The Roof Resource Team
${proposal.user.profile.phone} | ${proposal.user.email}
    `;

    // TODO: send email to the user logics

    // send response
    return res.json({
      message: 'Please send the mail to the customer and confirm it',
      mailBody,
      id: proposal._id,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal Server error' });
  }
};

// update a branch
const update = async (req, res) => {
  const { isSent } = req.body;
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Proposal for confirming send is not specified' });
    }

    const proposal = await Proposal.findById(id);
    if (!proposal) {
      return res.status(404).json({ message: 'Specified proposal does not exist' });
    }

    // update
    if (isSent !== undefined && isSent !== null) proposal.isSent = isSent;

    await proposal.save();

    // create invoice
    const invoice = await Invoice.findOne({ proposal: proposal._id });

    if (!invoice && isSent) {
      const newInvoice = new Invoice({
        proposal,
      });

      await newInvoice.save();
    }

    // TODO: send email to the user logics

    // send response
    res.json({
      message: 'Successfully sent the proposal',
      id,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal Server error' });
  }
};

// send info of a branch
const show = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ message: 'Proposal is not specified' });
    }

    const proposal = await Proposal.findById(id).populate(['user', 'branch']);

    if (!proposal) {
      return res.status(404).json({ message: 'Specified proposal does not exist' });
    }

    if (
      req.user.franchise &&
      req.user.franchise.branch.toString() !== proposal.branch._id.toString()
    ) {
      return res.status(403).json({ message: 'This proposal does not belong to your branch' });
    }

    const totalSquares = proposal.detail.squares * (1 + proposal.detail.percentWaste / 100);
    const projectFee = calculateProjectFee(totalSquares);

    // send response
    res.json({
      id,
      customer: proposal.customer,
      pricing: { ...proposal.pricing.toObject(), projectFee },
      detail: { ...proposal.detail.toObject(), totalSquares },
      options: proposal.options,
      isSent: proposal.isSent,
      createdAt: proposal.createdAt,
      admin: {
        name: `${proposal.user.profile.firstName} ${proposal.user.profile.lastName}`,
        phone: proposal.user.profile.phone,
        email: proposal.user.email,
      },
    });
  } catch (error) {
    console.log(error);
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
      // } else if (sort === 'name') {
      //   sortObject['name'] = 1; // Ascending order for customer.name
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
      roleMatch = { branch: req.user.franchise.branch };
    } else if (req.user.franchise.role === 'user') {
      // User: Fetch only proposals created by the user
      roleMatch = { user: req.user._id };
    }

    // Original search condition + role-based filtering
    const matchQuery = {
      ...roleMatch,
      $or: [{ 'customer.name': searchPattern }, { 'customer.address': searchPattern }],
    };

    // Aggregate query for search, pagination, and sorting
    const proposals = await Proposal.aggregate([
      {
        $match: matchQuery,
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
          name: '$customer.name',
          address: '$customer.address',
          isSent: 1,
        },
      },
    ]);

    // Get the total number of matching branches
    const totalProposals = await Proposal.countDocuments({
      $or: [{ 'customer.name': searchPattern }, { 'customer.address': searchPattern }],
    });

    // Send the response with branches and pagination metadata
    res.status(200).json({
      proposals,
      pagination: {
        totalLength: totalProposals,
        pageCount: Math.ceil(totalProposals / limitNumber),
        currentPage: totalProposals === 0 ? 1 : pageNumber,
        itemsPerPage: limitNumber,
      },
    });
  } catch (error) {
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
  mail,
};
