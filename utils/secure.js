const UserController = require("../modules/user/user.controller");
const EventModel = require("../modules/event/event.model");
const TeamModel = require("../modules/team/team.model");
const { ERR } = require("./error");
const { PM, Permissions } = require("./permissions");

//This processes token from header x-access-token
const SecureAPI = (...perms) => {
  return function (req, res, next) {
    //TODO need to verify permissions
    var token = req.cookies.access_token || req.body.access_token || req.query.access_token || req.headers["access_token"];
    if (!token) throw ERR.TOKON_REQ;

    UserController.validateToken(token)
      .then(t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];
        if (perms.length > 0) {
          if (!checkPermissions(user_perms, perms)) throw ERR.UNAUTHORIZED;
        }
        next();
      })
      .catch(next);
  };
};

//This processes token from cookies
const SecureUI = (...perms) => {
  return (req, res, next) => {
    //TODO need to figure a better way for currentEvent
    if (req.originalUrl) res.cookie("redirect_url", req.originalUrl);

    var token =
      req.cookies.access_token ||
      req.query.access_token ||
      req.body.access_token ||
      req.headers["access_token"];
    if (!token) {
      res.redirect("/login");
      return;
    }

    UserController.validateToken(token)
      .then(t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];
        if (perms.length > 0) {
          if (!checkPermissions(user_perms, perms)) {
            res.redirect("/unauthorized");
            return;
          }
        }
        next();
      })
      .catch(err => {
        console.log(err);
        res.clearCookie("redirect_url");
        res.redirect("/login");
        return;
      });
  };
};

const SecureEventUI = (...perms) => {
  return (req, res, next) => {
    if (req.originalUrl) res.cookie("redirect_url", req.originalUrl);

    var token =
      req.cookies.access_token ||
      req.query.access_token ||
      req.body.access_token ||
      req.headers["access_token"];
    if (!token) {
      res.redirect("/login");
      return;
    }

    if (!req.params.eventId) {
      res.redirect("/unauthorized");
      return;
    }

    UserController.validateToken(token)
      .then(async t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];

        //get event object
        const event = await EventModel.findById({ _id: req.params.eventId }).populate(
          "beneficiary"
        );
        if (!event) {
          res.redirect("/404");
          return;
        }
        //get specific acl details
        const teamAcl = await getEventAclFromTeam(event, t.data.user_id);
        const eventAcl = await getEventAcl(t.data.user_id, event);
        if (teamAcl.role == "admin" || teamAcl.role == "moderator") eventAcl.role = "admin";

        const permissions = [
          ...new Set([...user_perms, ...teamAcl.permissions, ...eventAcl.permissions])
        ];
        req.sessionData = {
          permissions,
          event,
          teamAcl,
          eventAcl
        };

        if (permissions.length > 0) {
          if (!checkPermissions(permissions, perms)) {
            res.redirect("/unauthorized");
            return;
          }
        }
        next();
      })
      .catch(err => {
        console.log(err);
        res.clearCookie("redirect_url");
        res.redirect("/");
        return;
      });
  };
};

const SecureEventAPI = (...perms) => {
  return (req, res, next) => {
    var token = req.cookies.access_token || req.query.access_token || req.body.access_token || req.headers["access_token"];
    var eventId = req.params.eventId || req.query.event_id || req.headers["event_id"];

    if (!token) throw ERR.TOKON_REQ;
    if (!eventId) throw ERR.EVENT_REQ;

    UserController.validateToken(token)
      .then(async t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];

        //get event object
        const event = await EventModel.findById({ _id: eventId }); //.populate("beneficiary")
        if (!event) throw ERR.EVENT_NOEXISTS;

        //get specific acl details
        const teamAcl = await getEventAclFromTeam(event, t.data.user_id);
        const eventAcl = await getEventAcl(t.data.user_id, event);
        if (teamAcl.role == "admin" || teamAcl.role == "moderator") eventAcl.role = "admin";

        const permissions = [
          ...new Set([...user_perms, ...teamAcl.permissions, ...eventAcl.permissions])
        ];
        req.sessionData = {
          permissions,
          event,
          teamAcl,
          eventAcl
        };
        if (permissions.length > 0) {
          if (!checkPermissions(permissions, perms)) throw ERR.UNAUTHORIZED;
        }
        next();
      })
      .catch(err => {
        next(err);
      });
  };
};

const SecureTeamUI = (...perms) => {
  return (req, res, next) => {
    if (req.originalUrl) res.cookie("redirect_url", req.originalUrl);

    var token =
      req.cookies.access_token ||
      req.query.access_token ||
      req.body.access_token ||
      req.headers["access_token"];

    if (!token) {
      res.redirect("/login");
      return;
    }

    if (!req.params.team_id) {
      res.redirect("/unauthorized");
      return;
    }

    UserController.validateToken(token)
      .then(async t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];

        const team = await TeamModel.findById({ _id: req.params.team_id });
        if (!team) {
          res.redirect("/404");
          return;
        }

        const teamAcl = await getTeamAcl(t.data.user_id, team);

        const permissions = [...new Set([...user_perms, ...teamAcl.permissions])];
        req.sessionData = {
          permissions,
          team,
          teamAcl
        };

        if (perms.length > 0) {
          if (!checkPermissions(permissions, perms)) {
            res.redirect("/unauthorized");
            return;
          }
        }
        next();
      })
      .catch(e => {
        res.clearCookie("redirect_url");
        res.redirect("/login");
        return;
      });
  };
};

const SecureTeamAPI = (...perms) => {
  return (req, res, next) => {
    let token = req.cookies.access_token || req.query.access_token || req.body.access_token || req.headers["access_token"];

    if (!token) throw ERR.TOKON_REQ;

    if (!req.params.team_id) throw ERR.TEAM_REQ;

    UserController.validateToken(token)
      .then(async t => {
        req.tokenData = t.data;
        let user_perms = t.data.permissions || [];

        const team = await TeamModel.findById({ _id: req.params.team_id });
        if (!team) throw ERR.TEAM_NOEXISTS;

        const teamAcl = await getTeamAcl(t.data.user_id, team);

        const permissions = [...new Set([...user_perms, ...teamAcl.permissions])];
        req.sessionData = {
          permissions,
          team,
          teamAcl
        };

        if (perms.length > 0) {
          if (!checkPermissions(permissions, perms)) throw ERR.UNAUTHORIZED;
        }
        next();
      })
      .catch(e => {
        next(e);
      });
  };
};

const getEventAcl = async (user_id, event) => {
  const defaultReturn = { role: null, permissions: [PM.EVENT_READ] };
  if (!event) return defaultReturn;
  let eventRole = event.acl
    .filter(el => {
      return el.user.toString() === user_id;
    })
    .map(e => {
      return e.eventRole;
    });

  if (eventRole.length > 0) eventRole = eventRole.toString();
  else return defaultReturn;

  if (event.owner.toString() == user_id) eventRole = "admin";

  if (eventRole == "admin")
    return {
      event,
      eventRole,
      permissions: [
        PM.EVENT_READ,
        PM.EVENT_WRITE,
        PM.EVENT_DELETE,
        PM.EVENT_USER,
        PM.EVENT_DONOR_READ,
        PM.EVENT_DONOR_WRITE,
        PM.EVENT_DONOR_DELETE
      ]
    };

  if (eventRole == "editor")
    return {
      event,
      role: eventRole,
      permissions: [
        PM.EVENT_READ,
        PM.EVENT_WRITE,
        PM.EVENT_DONOR_READ,
        PM.EVENT_DONOR_WRITE,
        PM.EVENT_DONOR_DELETE
      ]
    };

  if (eventRole == "reader")
    return { event, eventRole, permissions: [PM.EVENT_READ, PM.EVENT_DONOR_READ] };
  return defaultReturn;
};

const getEventAclFromTeam = async (event, user_id) => {
  let defaultReturn = { role: null, permissions: [] };
  if (!event) return defaultReturn;
  let team = await TeamModel.findById({ _id: event.team });
  if (!team) return defaultReturn;
  let teamRole = team.members
    .filter(mem => {
      return mem.user.toString() == user_id;
    })
    .map(el => {
      return el.role;
    });

  if (teamRole.length > 0) teamRole = teamRole.toString();
  else return defaultReturn;

  if (team.owner.toString() == user_id) teamRole = "admin";

  switch (teamRole) {
    case "admin":
    case "moderator":
      return {
        role: teamRole,
        permissions: [
          PM.EVENT_READ,
          PM.EVENT_WRITE,
          PM.EVENT_DELETE,
          PM.EVENT_USER,
          PM.EVENT_DONOR_READ,
          PM.EVENT_DONOR_WRITE,
          PM.EVENT_DONOR_DELETE
        ]
      };
  }
  return defaultReturn;
};

const getTeamAcl = async (user_id, team) => {
  const defaultReturn = { role: null, permissions: [] };
  if (!team) return defaultReturn;

  let teamRole = team.members
    .filter(mem => {
      return mem.user.toString() == user_id;
    })
    .map(m => {
      return m.role;
    });
  if (teamRole.length > 0) teamRole = teamRole.toString();
  else return defaultReturn;

  if (team.owner.toString == user_id) teamRole = "admin";
  switch (teamRole) {
    case "admin":
      return {
        team,
        teamRole,
        permissions: [PM.TEAM_MANAGE, PM.TEAM_WRITE, PM.TEAM_READ, PM.TEAM_DELETE, PM.TEAM_USER]
      };

    case "moderator":
      return {
        team,
        teamRole,
        permissions: [PM.TEAM_USER, PM.TEAM_WRITE, PM.TEAM_READ, PM.TEAM_DELETE]
      };
    default:
      return defaultReturn;
  }
};

const checkPermissions = (user_perm, access_perm) => {
  if (access_perm.length == 0) return true;
  return user_perm.some(v => access_perm.indexOf(v) !== -1);
};

module.exports = {
  PM,
  Permissions,
  SecureAPI,
  SecureUI,
  SecureEventAPI,
  SecureEventUI,
  SecureTeamAPI,
  SecureTeamUI
};
