const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Allow Metro to bundle .html files as static assets (legacy Stitch prototype viewer).
config.resolver.assetExts.push('html', 'lottie', 'mov', 'gif');


module.exports = withNativeWind(config, { input: './global.css' });
