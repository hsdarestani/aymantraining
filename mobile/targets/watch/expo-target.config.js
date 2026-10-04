/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch",
  icon: "../../assets/favicon.png",
  colors: { $accent: "#D7FF00" },
  deploymentTarget: "10.0"
});
