const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for resolving modules
config.resolver.alias = {
  '@': './src',
};

module.exports = config;
