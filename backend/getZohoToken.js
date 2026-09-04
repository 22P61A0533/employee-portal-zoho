const axios = require("axios");
require("dotenv").config();

const params = new URLSearchParams();

params.append("grant_type", "authorization_code");
params.append("client_id", process.env.ZOHO_CLIENT_ID);
params.append("client_secret", process.env.ZOHO_CLIENT_SECRET);
params.append("code", process.env.ZOHO_AUTH_CODE);

axios
  .post(`${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, params)
  .then(response => {
    console.log("Zoho token response:");
    console.log(response.data);
  })
  .catch(error => {
    console.error(
      "Zoho token error:",
      error.response?.data || error.message
    );
  });