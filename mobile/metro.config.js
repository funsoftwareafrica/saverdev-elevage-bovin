// Metro config — support web + SVG + path alias @/
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Support des icônes SVG si besoin (on utilise lucide-react-native natif)
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");

module.exports = config;
