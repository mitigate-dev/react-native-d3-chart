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

    // Copy iOS assets to app bundle root with prefixed names
    if (fs.existsSync(iosAssetsSource)) {
      try {
        const iosDir = path.join(appRoot, 'ios');
        if (fs.existsSync(iosDir)) {
          // Find the iOS app target directory
          const iosFiles = fs.readdirSync(iosDir);
          const xcodeProj = iosFiles.find((file) =>
            file.endsWith('.xcodeproj')
          );

          if (xcodeProj) {
            const appName = xcodeProj.replace('.xcodeproj', '');
            const appTargetDir = path.join(iosDir, appName);

            // Copy files to iOS project root (not inside app target directory)
            try {
              // Copy each file with react-native-d3-chart prefix
              const files = fs.readdirSync(iosAssetsSource);
              files.forEach((file) => {
                const sourcePath = path.join(iosAssetsSource, file);
                const prefixedFileName = `react-native-d3-chart-${file}`;
                const targetPath = path.join(iosDir, prefixedFileName);

                  // Only copy files (not directories or .DS_Store)
                  if (
                    fs.lstatSync(sourcePath).isFile() &&
                    !file.startsWith('.DS_Store')
                  ) {
                    if (file === 'chart.html') {
                      // For HTML file, update script references to use prefixed names
                      let htmlContent = fs.readFileSync(sourcePath, 'utf8');
                      htmlContent = htmlContent
                        .replace(
                          'src="d3.v7.min.js"',
                          'src="react-native-d3-chart-d3.v7.min.js"'
                        )
                        .replace(
                          'src="d3-time-format.js"',
                          'src="react-native-d3-chart-d3-time-format.js"'
                        );

                      fs.writeFileSync(targetPath, htmlContent);
                      console.log(
                        `react-native-d3-chart: Created iOS-specific ${prefixedFileName} with updated script references`
                      );
                    } else {
                      // For other files, just copy
                      fs.copyFileSync(sourcePath, targetPath);
                      console.log(
                        `react-native-d3-chart: Copied ${file} to iOS bundle as ${prefixedFileName}`
                      );
                    }
                  }
                });

                // Add assets to Xcode project
                try {
                  const {
                    addAssetsToXcodeProject,
                  } = require('./add-ios-assets.js');
                  const xcodeProjectPath = path.join(iosDir, xcodeProj);
                  const assetFiles = files
                    .filter(
                      (file) =>
                        !file.startsWith('.DS_Store') &&
                        fs.lstatSync(path.join(iosAssetsSource, file)).isFile()
                    )
                    .map((file) => `react-native-d3-chart-${file}`);

                  addAssetsToXcodeProject(xcodeProjectPath, assetFiles);
                } catch (error) {
                  console.warn(
                    'react-native-d3-chart: Failed to update Xcode project:',
                    error.message
                  );
                }
              } catch (error) {
                console.warn(
                  'react-native-d3-chart: Failed to copy iOS assets:',
                  error.message
                );
              }
          } else {
            console.log(
              'react-native-d3-chart: No Xcode project found, skipping iOS assets'
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
