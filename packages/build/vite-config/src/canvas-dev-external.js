import vitePluginExternalize from 'vite-plugin-externalize-dependencies'
import { genImportMapPlugin } from './vite-plugins/genImportMapOnly.js'
import { replaceOrigins } from './localCdnFile/importMapLocalPlugin.js'

export const dependencies = {
  base:{
    externals: [/^vue$/, /^vue-i18n$/],
    imports: {
      "vue": "http://172.31.243.56:8866/npmlibs/vue/vue.runtime.esm-browser.js",
      "vue-i18n": "http://172.31.243.56:8866/npmlibs/vue-i18n/vue-i18n.esm-browser.js",
    }
  },
  ui: {
    externals: [/^@opentiny\/vue$/, /^@opentiny\/vue-icon$/, /^@opentiny\/vue-common$/, /^@opentiny\/vue-locale$/, /^echarts$/],
    imports: {
      'echarts': 'http://172.31.243.56:8866/npmlibs/echarts/echarts.esm.js',
      '@opentiny/vue': 'http://172.31.243.56:8866/npmlibs/@opentiny/vue/3.37.0/tiny-vue-pc.mjs',
      '@opentiny/vue-icon': 'http://172.31.243.56:8866/npmlibs/@opentiny/vue/3.37.0/tiny-vue-icon.mjs',
      '@opentiny/vue-common': 'http://172.31.243.56:8866/npmlibs/@opentiny/vue/3.37.0/tiny-vue-common.mjs',
      '@opentiny/vue-locale': 'http://172.31.243.56:8866/npmlibs/@opentiny/vue/3.37.0/tiny-vue-locale.mjs',
    },
    importStyles: [
      'http://172.31.243.56:8866/npmlibs/@opentiny/vue/3.37.0/style.css',
    ]
  }
}
export function canvasDevExternal(override = {}) {
  const _styles = [...dependencies.ui.importStyles]
  const _scripts = { ...dependencies.base.imports, ...dependencies.ui.imports, ...override }
  const [scripts, styles] = replaceOrigins(_scripts, _styles)
  console.warn(scripts, styles, '------')
  return [
    vitePluginExternalize({ externals: [...dependencies.base.externals, ...dependencies.ui.externals] }),
    genImportMapPlugin(
      { imports: { ...scripts } },
      [...styles]
    )
  ]
}
