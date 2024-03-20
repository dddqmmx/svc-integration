const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  // transpileDependencies: true,
  // outputDir: 'dist_electron',
  // assetsDir: 'public',
  filenameHashing: false,
  pluginOptions:{
    electronBuilder:{
      // files: ['public'],
      nodeIntegration: true, 
    }
  },

})
