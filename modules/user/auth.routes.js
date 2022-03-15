const validators = require('./user.validators');
const controllers = require('./user.controllers');

const routes = {
	login: ['POST', '', 'Login using username and password'],
	auth: ['get', '', 'Get the token data'],
	generateOTP: ['POST', '/otp-generate', 'Generate OTP'],
	verifyOTP: ['POST', '/otp-verify', 'Verify OTP'],
	googleLogin: ['POST', '/google-login', 'Google Login'],
	sendPneumonicsToEmail: ['POST', '/pneumonics-email', 'Send pneumonics to email'],
};

/**
 * Register the routes
 * @param {object} app Application.
 */
function register(app) {
	app.register({
		name: 'auth',
		routes,
		validators,
		controllers,
	});
}

module.exports = register;
