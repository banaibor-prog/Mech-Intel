const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Workspace-local Android/Gradle/npm scratch dirs (see README) are large and
// irrelevant to the JS bundle; watching them slows Metro's file crawl to a crawl.
const blockList = new RegExp(
  [
    /\.gradle-user-home[\\/].*/,
    /\.android-emulator-data[\\/].*/,
    /\.android-emulator-home[\\/].*/,
    /\.android-temp[\\/].*/,
    /\.npm-cache[\\/].*/,
    /android[\\/]\.gradle[\\/].*/,
    /android[\\/]build[\\/].*/,
    /android[\\/]app[\\/]build[\\/].*/,
  ]
    .map((re) => re.source)
    .join('|')
);

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  resolver: {
    blockList,
  },
};

module.exports = mergeConfig(defaultConfig, config);
