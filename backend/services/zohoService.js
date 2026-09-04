const axios = require("axios");

let accessToken = null;
let tokenExpiresAt = 0;

const getAccessToken = async () => {
  if (accessToken && Date.now() < tokenExpiresAt) {
    return accessToken;
  }

  const params = new URLSearchParams();

  params.append("refresh_token", process.env.ZOHO_REFRESH_TOKEN);
  params.append("client_id", process.env.ZOHO_CLIENT_ID);
  params.append("client_secret", process.env.ZOHO_CLIENT_SECRET);
  params.append("grant_type", "refresh_token");

  const response = await axios.post(
    `${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
    params
  );

  accessToken = response.data.access_token;

  tokenExpiresAt =
    Date.now() + (response.data.expires_in - 60) * 1000;

  return accessToken;
};

const getCRMLeads = async () => {
  const token = await getAccessToken();

  const response = await axios.get(
    `${process.env.ZOHO_API_DOMAIN}/crm/v8/Leads?fields=Last_Name,First_Name,Email,Company`,
    {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    }
  );

  return response.data;
};

module.exports = {
  getAccessToken,
  getCRMLeads,
};