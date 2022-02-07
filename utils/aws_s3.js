var crypto = require("crypto");
var config = require("config");

function dateString() {
  var date = new Date().toISOString();
  return date.substr(0, 4) + date.substr(5, 2) + date.substr(8, 2);
}

function hmac(key, string) {
  var hmac = crypto.createHmac("sha256", key);
  hmac.end(string);
  return hmac.read();
}

class aws_s3 {
  constructor(cfg) {
    cfg = cfg || {};
    this.bucket = cfg.bucket || config.get("services.aws_s3.bucket");
    this.region = cfg.region || config.get("services.aws_s3.region");
    this.accessKey = cfg.accessKey || config.get("services.aws_s3.access_key");
    this.secret = cfg.secret || config.get("services.aws_s3.secret");

    this.maxSize = cfg.maxSize || 10000000;
    this.expiration = cfg.expiration || new Date(new Date().getTime() + 5 * 60 * 1000);
    this.expiration = this.expiration.toISOString();
  }

  createPolicy(params, credential) {
    return {
      expiration: this.expiration,
      conditions: [
        { bucket: this.bucket },
        { key: params.filename },
        { acl: "public-read" },
        { success_action_status: "201" },
        // Optionally control content type and file size
        // A content-type clause is required (even if it's all-permissive)
        // so that the uploader can specify a content-type for the file
        ["starts-with", "$Content-Type", ""],
        ["content-length-range", 0, this.maxSize],
        { "x-amz-algorithm": "AWS4-HMAC-SHA256" },
        { "x-amz-credential": credential },
        { "x-amz-date": dateString() + "T000000Z" }
      ]
    };
  }

  createSignature(policyBase64) {
    var dateKey = hmac("AWS4" + this.secret, dateString());
    var dateRegionKey = hmac(dateKey, this.region);
    var dateRegionServiceKey = hmac(dateRegionKey, "s3");
    var signingKey = hmac(dateRegionServiceKey, "aws4_request");
    return hmac(signingKey, policyBase64).toString("hex");
  }

  s3Params(params) {
    var credential = [this.accessKey, dateString(), this.region, "s3/aws4_request"].join("/");
    var policy = this.createPolicy(params, credential);
    var policyBase64 = new Buffer(JSON.stringify(policy)).toString("base64");
    return {
      key: params.filename,
      acl: "public-read",
      success_action_status: "201",
      policy: policyBase64,
      "content-type": params.contentType,
      "x-amz-algorithm": "AWS4-HMAC-SHA256",
      "x-amz-credential": credential,
      "x-amz-date": dateString() + "T000000Z",
      "x-amz-signature": this.createSignature(policyBase64)
    };
  }

  s3Credentials(params) {
    return {
      endpoint_url: "https://" + this.bucket + ".s3.amazonaws.com",
      params: this.s3Params(params)
    };
  }
}

module.exports = aws_s3;
