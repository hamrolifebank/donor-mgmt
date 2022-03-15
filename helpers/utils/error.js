const config = require('config');

class RSError extends Error {
	constructor(message, name, httpCode) {
		super();
		this.message = message;
		this.data = {
			group: config.get('app.name'),
			type: 'rserror',
			message,
			name: name || 'none',
			httpCode: httpCode || 500,
		};
		this.status = httpCode || 500;
		this.className = this.constructor.name;
		this.stack = new Error(message).stack;
	}
}

const ERR = {
	DEFAULT: new RSError('Error Occured', 'none', 500),
	AUTH_FAIL: new RSError('Authentication failed. Please try again.', 'auth_fail', 401),
	UNAUTHORIZED: new RSError("You don't have access to do that.", 'unauthorized', 401),
	PWD_SAME: new RSError('Please send different new password', 'pwd_same', 400),
	PWD_NOTMATCH: new RSError('Old password does not match.', 'pwd_notmatch', 400),
	TOKEN_REQ: new RSError('Must send access_token', 'token_req', 400),
	USER_NOEXISTS: new RSError('User does not exists.', 'user_noexists', 400),
	PHONE_EXISTS: new RSError('Phone Number already exists.', 'phone_exists', 400),
	EMAIL_EXISTS: new RSError('Email already exists.', 'email_exists', 400),
	INVALID_COORDINATES: new RSError(
		'Invalid Coordinates. Longitude should be in betweeen -180 and 180. Latitude should be in between -90 and 90',
		'invalid_coordinates',
		400,
	),
	ORG_PHONE_EXISTS: new RSError('Phone Number is already registered', 'org_phone_exists', 400),
	ORG_EMAIL_EXISTS: new RSError('Email already registered.', 'org_email_exists', 400),
	EMAIL_NOEXISTS: new RSError('Email does not exists.', 'email_noexists', 400),
	PHONE_NOEXISTS: new RSError('Phone does not exists.', 'phone_noexists', 400),
	OVERORDERED: new RSError('Quantity selected is higher than availability of product', 'overordered', 400),
	SIGNATURE_EXPIRED: new RSError('Signature expired', 'expired', 401),
	SIGNATURE_NO_MATCH: new RSError('Signature does not match', 'expired', 401),
	AUTH_SIGNATURE_NO_DATA: new RSError('Auth signature does not have data', 'no data', 403),
	DATA_SIGNATURE_NO_DATA: new RSError('Data signature does not have data', 'no data', 403),

	// DEFAULT: new RSError('', '', 400),
};

const throwError = err => {
	throw err;
};
module.exports = { Error: RSError, ERR, throwError };
