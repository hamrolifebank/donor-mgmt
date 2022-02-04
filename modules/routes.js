const auth = require('./user/auth.routes');
const role = require('./user/role.routes');
const user = require('./user/user.routes');
const donor = require('./donor/donor.routes');

module.exports = {
	auth,
	role,
	user,
	donor,
};
