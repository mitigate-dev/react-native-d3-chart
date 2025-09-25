#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Generate a UUID-like identifier for Xcode (24 characters hex)
function generateXcodeId() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

function addAssetsToXcodeProject(projectPath, assetFiles) {
  try {
    console.log('react-native-d3-chart: Adding assets to Xcode project...');

    const pbxprojPath = path.join(projectPath, 'project.pbxproj');
    if (!fs.existsSync(pbxprojPath)) {
      console.warn(
        'react-native-d3-chart: project.pbxproj not found at:',
        pbxprojPath
      );
      return;
    }

    let content = fs.readFileSync(pbxprojPath, 'utf8');

    // Check if assets are already added to avoid duplicates
    if (content.includes('react-native-d3-chart-chart.html')) {
      console.log(
        'react-native-d3-chart: Assets already exist in Xcode project'
      );
      return;
    }

    // Generate unique IDs for each asset
    const assetIds = {};
    const buildFileIds = {};

    assetFiles.forEach((file) => {
      assetIds[file] = generateXcodeId().toUpperCase();
      buildFileIds[file] = generateXcodeId().toUpperCase();
    });

    // Add PBXBuildFile entries
    const buildFileSection = content.match(
      /(\/\* Begin PBXBuildFile section \*\/\n)([\s\S]*?)(\/\* End PBXBuildFile section \*\/)/
    );
    if (buildFileSection) {
      let newBuildFiles = '';
      assetFiles.forEach((file) => {
        newBuildFiles += `\t\t${buildFileIds[file]} /* ${file} in Resources */ = {isa = PBXBuildFile; fileRef = ${assetIds[file]} /* ${file} */; };\n`;
      });

      const updatedBuildFileSection =
        buildFileSection[1] +
        buildFileSection[2] +
        newBuildFiles +
        buildFileSection[3];
      content = content.replace(buildFileSection[0], updatedBuildFileSection);
    }

    // Add PBXFileReference entries
    const fileRefSection = content.match(
      /(\/\* Begin PBXFileReference section \*\/\n)([\s\S]*?)(\/\* End PBXFileReference section \*\/)/
    );
    if (fileRefSection) {
      let newFileRefs = '';
      assetFiles.forEach((file) => {
        const fileType = file.endsWith('.html')
          ? 'text.html'
          : 'sourcecode.javascript';
        newFileRefs += `\t\t${assetIds[file]} /* ${file} */ = {isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = ${fileType}; name = ${file}; path = ${file}; sourceTree = "<group>"; };\n`;
      });

      const updatedFileRefSection =
        fileRefSection[1] + fileRefSection[2] + newFileRefs + fileRefSection[3];
      content = content.replace(fileRefSection[0], updatedFileRefSection);
    }

    // Add files to the main group (D3ChartExample group)
    const mainGroupMatch = content.match(
      /(13B07FAE1A68108700A75B9A \/\* D3ChartExample \*\/ = \{\n\s+isa = PBXGroup;\n\s+children = \(\n)([\s\S]*?)(\s+\);\n\s+name = D3ChartExample;)/
    );
    if (mainGroupMatch) {
      let newGroupEntries = '';
      assetFiles.forEach((file) => {
        newGroupEntries += `\t\t\t\t${assetIds[file]} /* ${file} */,\n`;
      });

      const updatedMainGroup =
        mainGroupMatch[1] +
        mainGroupMatch[2] +
        newGroupEntries +
        mainGroupMatch[3];
      content = content.replace(mainGroupMatch[0], updatedMainGroup);
    }

    // Add to Resources build phase
    const resourcesPhaseMatch = content.match(
      /(13B07F8E1A680F5B00A75B9A \/\* Resources \*\/ = \{\n\s+isa = PBXResourcesBuildPhase;\n\s+buildActionMask = 2147483647;\n\s+files = \(\n)([\s\S]*?)(\s+\);\n\s+runOnlyForDeploymentPostprocessing = 0;\n\s+\};)/
    );
    if (resourcesPhaseMatch) {
      let newResourceEntries = '';
      assetFiles.forEach((file) => {
        newResourceEntries += `\t\t\t\t${buildFileIds[file]} /* ${file} in Resources */,\n`;
      });

      // Ensure the existing content ends with a newline before adding new entries
      let existingContent = resourcesPhaseMatch[2];
      if (existingContent.trim() && !existingContent.endsWith('\n')) {
        existingContent += '\n';
      }

      const updatedResourcesPhase =
        resourcesPhaseMatch[1] +
        existingContent +
        newResourceEntries +
        resourcesPhaseMatch[3];
      content = content.replace(resourcesPhaseMatch[0], updatedResourcesPhase);
    }

    // Write back the modified content
    fs.writeFileSync(pbxprojPath, content);
    console.log(
      'react-native-d3-chart: Successfully added assets to Xcode project'
    );

    assetFiles.forEach((file) => {
      console.log(`react-native-d3-chart: Added ${file} to iOS bundle`);
    });
  } catch (error) {
    console.warn(
      'react-native-d3-chart: Failed to modify Xcode project:',
      error.message
    );
  }
}

module.exports = { addAssetsToXcodeProject };

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(
      'Usage: node add-ios-assets.js <xcodeproj-path> <asset-file1> [asset-file2] ...'
    );
    process.exit(1);
  }

  const projectPath = args[0];
  const assetFiles = args.slice(1);

  addAssetsToXcodeProject(projectPath, assetFiles);
}
