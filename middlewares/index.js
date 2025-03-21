const resEnhancer = require('./resEnhancer');
const auth = require('./auth');
const onlySuper = require('./onlySuper');
const onlyAdmin = require('./onlyAdmin');

module.exports = {
  resEnhancer,
  auth,
  onlyAdmin,
  onlySuper,
};
