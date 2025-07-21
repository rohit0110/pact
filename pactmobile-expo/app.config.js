// app.config.js
require('dotenv').config();

export default () => ({
  expo: {
    name: "pactmobile-expo",
    slug: "pactmobile-expo",
    version: "1.0.0",
    extra: {
      PRIVY_APP_ID: process.env.PRIVY_APP_ID,
      PRIVY_CLIENT_ID: process.env.PRIVY_CLIENT_ID,
    },
  },
});
