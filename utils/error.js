const config = require("config");
class RSError extends Error {
  constructor(message, name, httpCode) {
    super();
    this.message = message;
    this.data = {
      group: config.get("app.name"),
      type: "rserror",
      message: message,
      name: name || "none",
      httpCode: httpCode || 500
    };
    this.status = httpCode || 500;
    this.className = this.constructor.name;
    this.stack = new Error(message).stack;
  }
}

const ERR = {
  ADMIN_EXISTS: new RSError("Admin already exists with same Username", 401),
  EDITOR_EXISTS: new RSError("Editor already exists with same Username", 401),
  GUEST_EXISTS: new RSError("Guest already exists with same Username", 401),
  DEFAULT: new RSError("Error Occured", "none", 500),
  APPINFO_REQ: new RSError("Must send social app information", "appinfo_req", 400),
  AUTH_FAIL: new RSError("Authentication failed. Please try again.", "auth_fail", 401),
  CURUSER_REQ: new RSError("Current user is required to update this record.", "curuser_req", 500),
  DATE_FUTURE: new RSError("Date is in future", "date_future", 400),
  EVENT_REQ: new RSError("Must send event Id", "event_req", 400),
  EVENT_NOEXISTS: new RSError("Event does not exists", "event_noexists", 400),
  INVALID_PAYLOAD: new RSError("Specified field does not contain payload field", 400),
  PWD_SAME: new RSError("Please send different new password", "pwd_same", 400),
  PWD_NOTMATCH: new RSError("Old password does not match.", "pwd_notmatch", 400),
  ROLES_NOEXISTS: new RSError("Role(s) does not exists.", "roles_noexists", 400),
  TEAM_REQ: new RSError("Must send team Id", "team_req", 400),
  TEAM_NOEXISTS: new RSError("Team does not exists", "team_noexists", 400),
  TOKON_REQ: new RSError("Must send access_token", "token_req", 400),
  UNAUTHORIZED: new RSError("Unauthorized access", "unauthorized", 401),
  USER_NOEXISTS: new RSError("User does not exists.", "user_noexists", 400)

  //DEFAULT: new RSError('', '', 400),
};

const throwError = err => {
  throw err;
};
module.exports = {
  Error: RSError,
  ERR,
  throwError
};
