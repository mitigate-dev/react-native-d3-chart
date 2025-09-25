#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// This script copies assets from react-native-d3-chart to the React Native app
// It runs automatically when the library is installed via npm/yarn

function copyAssets() {
  try {
    // Check if we're in node_modules (installed as dependency)
    const isInNodeModules = __dirname.includes('node_modules');

    if (!isInNodeModules && !process.env.FORCE_COPY) {
      // We're in development mode, skip copying unless forced
      console.log(
        'react-native-d3-chart: Skipping asset copy in development mode (set FORCE_COPY=1 to override)'
      );
      return;
    }

    // Find the React Native app root
    let appRoot;
    if (isInNodeModules) {
      // In production: should be 2 levels up from node_modules/react-native-d3-chart
      appRoot = path.resolve(__dirname, '../../..');
    } else {
      // In development: use the example directory as app root
      appRoot = path.resolve(__dirname, '../example');
    }

    // Asset source locations in the library
    const androidAssetsSource = path.join(
      __dirname,
      '../android/src/main/assets'
    );
    const iosAssetsSource = path.join(__dirname, '../ios/assets');

    // Asset destination locations in the consuming app
    const androidAssetsTarget = path.join(
      appRoot,
      'android/app/src/main/assets/react-native-d3-chart'
    );

    // Copy Android assets
    if (fs.existsSync(androidAssetsSource)) {
      try {
        // Ensure target directory exists
        fs.mkdirSync(androidAssetsTarget, { recursive: true });

        // Copy each file
        const files = fs.readdirSync(androidAssetsSource);
        files.forEach((file) => {
          const sourcePath = path.join(androidAssetsSource, file);
          const targetPath = path.join(androidAssetsTarget, file);

          // Only copy files (not directories)
          if (fs.lstatSync(sourcePath).isFile()) {
            fs.copyFileSync(sourcePath, targetPath);
            console.log(
              `react-native-d3-chart: Copied ${file} to Android assets`
            );
          }
        });
      } catch (error) {
        console.warn(
          'react-native-d3-chart: Failed to copy Android assets:',
          error.message
        );
      }
    } else {
      console.warn(
        'react-native-d3-chart: Android assets not found at:',
        androidAssetsSource
      );
    }

    // Copy iOS assets
    if (fs.existsSync(iosAssetsSource)) {
      try {
        const iosDir = path.join(appRoot, 'ios');
        if (fs.existsSync(iosDir)) {
          // iOS assets should go to ios/assets directory
          const iosAssetsTargetDir = path.join(iosDir, 'assets');

          try {
            // Ensure target directory exists
            fs.mkdirSync(iosAssetsTargetDir, { recursive: true });

            // Copy each file
            const files = fs.readdirSync(iosAssetsSource);
            files.forEach((file) => {
              const sourcePath = path.join(iosAssetsSource, file);
              const targetPath = path.join(iosAssetsTargetDir, file);

              // Only copy files (not directories or .DS_Store)
              if (
                fs.lstatSync(sourcePath).isFile() &&
                !file.startsWith('.DS_Store')
              ) {
                fs.copyFileSync(sourcePath, targetPath);
                console.log(
                  `react-native-d3-chart: Copied ${file} to iOS assets`
                );
              }
            });
          } catch (error) {
            console.warn(
              'react-native-d3-chart: Failed to copy iOS assets:',
              error.message
            );
          }
        } else {
          console.log(
            'react-native-d3-chart: iOS directory not found, skipping iOS assets'
          );
        }
      } catch (error) {
        console.warn(
          'react-native-d3-chart: Failed to access iOS directory:',
          error.message
        );
      }
    } else {
      console.warn(
        'react-native-d3-chart: iOS assets not found at:',
        iosAssetsSource
      );
    }

    console.log('react-native-d3-chart: Assets copied successfully');
  } catch (error) {
    console.warn(
      'react-native-d3-chart: Failed to copy assets:',
      error.message
    );
  }
}

copyAssets();
