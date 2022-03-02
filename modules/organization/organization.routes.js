const validators = require('./organization.validators');
const controllers = require('./organization.controllers');

const routes = {};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'organizations',
		routes,
		validators,
		controllers,
	});
}

module.exports = register;
