const { NODE_ENV } = process.env;

const prod = NODE_ENV === "production";
const dev = NODE_ENV === "development";

module.exports = {
  presets: [
    [
      "next/babel",
      {
        "preset-env": {
          targets: prod ? "defaults" : ["last 1 chrome version"],
        },
      },
    ],
  ],
};
