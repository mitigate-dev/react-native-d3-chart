module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: '../android',
        packageImportPath: 'dev.mitigate.d3chart.D3ChartPackage',
      },
      ios: {
        podspecPath: '../D3Chart.podspec',
      },
    },
    assets: ['android/src/main/assets', 'ios/assets'], // Note: relative to library root
  },
}
