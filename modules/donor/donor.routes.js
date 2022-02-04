const validators = require('./donor.validators');
const controllers = require('./donor.controllers');

const routes = {
	add: ['POST', '', 'Add donor'],
	list: ['GET', '', 'List all donors'],
	getById: ['GET', '/{id}', 'Find donor by ID'],
	getByPhone: ['GET', '/byphone', 'Find donor by phone number'],
	getByName: ['GET', '/byname', 'Find donor by name'],
	update: ['PUT', '/{id}', 'Update a donor'],
	remove: ['DELETE', '/{id}', 'Remove a donor'],
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
