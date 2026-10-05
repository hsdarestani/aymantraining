/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = config => ({
  type: "watch-widget",
  bundleIdentifier: ".watch.widget",
  colors: { $accent: "#D7FF00" },
  deploymentTarget: "10.0"
});
