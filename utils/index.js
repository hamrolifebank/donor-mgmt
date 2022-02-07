const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;
const { Error, ERR } = require("./error");
const { PM, Permissions } = require("./permissions");
const TextUtils = {
  pascalToCamelCase: s =>
    s.replace(/\.?([A-Z])/g, (x, y) => "_" + y.toLowerCase()).replace(/^_/, ""),
  escapeRegex: text => text.replace(/[-[\]{}()*=?.,\\^$|#\s]/g, "\\$&"),
  randomText: length => {
    return Math.random()
      .toString(36)
      .slice(-8);
  }
};

const ObjectUtils = {
  checkEmptyObject: obj => {
    return Object.keys(obj).length > 0 ? true : false;
  },
  deleteProps: (obj, prop) => {
    if (typeof prop == "string") prop = prop.split(",");
    for (const p of prop) {
      p in obj && delete obj[p];
    }
  }
};

const DataUtils = {
  paging: async ({ start = 0, limit = 20, sort, model, query }) => {
    query.push({
      $sort: sort
    });
    query.push({
      $facet: {
        data: [
          {
            $skip: parseInt(start)
          },
          {
            $limit: parseInt(limit)
          }
        ],
        total: [
          {
            $group: {
              _id: null,
              count: {
                $sum: 1
              }
            }
          }
        ]
      }
    });
    let matchedData = await model.aggregate(query);

    let data = [],
      total = 0;
    if (matchedData[0].data.length > 0) {
      data = matchedData[0].data;
      total = matchedData[0].total[0].count;
    }

    return {
      data,
      total,
      limit,
      start,
      page: Math.round(start / limit) + 1
    };
  }
};

const DBUtils = {
  addCreator: (payload = {}, options = {}) => {
    if (!options.currentUser) throw ERR.CURUSER_REQ;
    payload.created_by = ObjectId(options.currentUser);
    payload.updated_by = ObjectId(options.currentUser);
    return payload;
  },

  addUpdator: (payload = {}, options = {}) => {
    if (!options.currentUser) throw ERR.CURUSER_REQ;
    payload.updated_by = ObjectId(options.currentUser);
    return payload;
  }
};

module.exports = {
  TextUtils,
  DataUtils,
  DBUtils,
  Error,
  ERR,
  ObjectUtils,
  PM,
  Permissions,
  ObjectUtils
};
