const PM = (Permissions = {
  DONOR_WRITE: "donor_write",
  DONOR_DELETE: "donor_delete",
  DONOR_LIST: "donor_list",
  DONOR_READ: "donor_read",
  EVENT_READ: "event_read",
  EVENT_WRITE: "event_write",
  EVENT_DELETE: "event_delete",
  EVENT_USER: "event_user",
  EVENT_DONOR_READ: "event_donor_read",
  EVENT_DONOR_WRITE: "event_donor_write",
  EVENT_DONOR_DELETE: "event_donor_delete",
  TEAM_WRITE: "team_write",
  TEAM_DELETE: "team_delete",
  TEAM_READ: "team_read",
  TEAM_USER: "team_user",
  TEAM_MANAGE: "team_manage",
  SETTINGS_READ: "settings_read",
  SETTINGS_UPDATE: "settings_update",
  USER_WRITE: "user_write",
  USER_DELETE: "user_delete",
  USER_READ: "user_read",
  USER_LIST: "user_list",
  TEAM_ADMIN: "team_admin"
});

module.exports = {
  PM,
  Permissions
};
