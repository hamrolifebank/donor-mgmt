const validators = require('./donor.validators');
const controllers = require('./donor.controllers');

const routes = {
	add: ['POST', '', 'Add donor'],
	addSingleVerified: ['POST', '/add-single-verified', 'Add single verified'],
	list: ['GET', '', 'List all donors'],
	getById: ['GET', '/{id}', 'Find donor by ID'],
	getByPhone: ['GET', '/byphone', 'Find donor by phone number'],
	getByName: ['GET', '/byname', 'Find donor by name'],
	update: ['POST', '/{id}', 'Update a donor'],
	remove: ['DELETE', '/{id}', 'Remove a donor'],
	addDonation: ['POST', '/{id}/donations', 'Add donations'],
	removeDonation: ['DELETE', '/{id}/donations', 'Remove donations'],
	dispatch: ['GET', '/dispatch/{id}', 'Dispatch donors'],
};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'donors',
		routes,
		validators,
		controllers,
	});
}

module.exports = register;
