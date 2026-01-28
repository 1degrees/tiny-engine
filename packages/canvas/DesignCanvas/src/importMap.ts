import { replaceUrl } from '@opentiny/tiny-engine-utils'
import { useEnv, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { importMapConfig } from '@opentiny/tiny-engine-common/js/importMap'

const getImportUrl = (pkgName: string) => {
  // 自定义的 importMap
  const customImportMap = getMergeMeta('engine.config')?.importMap
  // 全局配置的map
  const importsMap: any = importMapConfig?.imports
  const stylesMap: any = importMapConfig?.importStyles
  const scriptsMap: any = importMapConfig?.importScripts
  const url = customImportMap?.imports?.[pkgName] ||
    importsMap?.[pkgName] ||
    scriptsMap?.[pkgName] ||
    stylesMap?.[pkgName] 
  return replaceUrl(url, false)
}

export function getImportMapData(canvasDeps = { scripts: [], styles: [] }) {
  // 以下内容由于区块WebComponent加载需要补充
  const blockRequire = {
    imports: {
      // TODO: 后续版本发通知，不再内置物料，需要用户自行引入
      '@opentiny/vue': getImportUrl('@opentiny/vue'),
      '@opentiny/vue-icon': getImportUrl('@opentiny/vue-icon'),
      '@opentiny/tiny-engine-builtin-component': getImportUrl('@opentiny/tiny-engine-builtin-component')
   },
    importStyles: [getImportUrl('@opentiny/vue-theme')]
  }

  // 以下内容由于物料协议不支持声明子依赖而@opentiny/vue需要依赖所以需要补充
  // TODO: 后续版本发通知，不再内置物料，需要用户自行引入
  const tinyVueRequire = {
    imports: {
      '@opentiny/vue-common': getImportUrl('@opentiny/vue-common'),
      '@opentiny/vue-locale': getImportUrl('@opentiny/vue-locale'),
      'echarts': getImportUrl('echarts')
    }
  }

  const materialsAndUtilsRequire = canvasDeps.scripts.reduce((imports, { package: pkg, script }) => {
    if (pkg && script) {
      imports[pkg] = replaceUrl(script) as never
    }
    return imports
  }, {})

  const importMap = {
    imports: {
      vue: getImportUrl('vue'),
      'vue-i18n': getImportUrl('vue-i18n'),
      ...blockRequire.imports,
      ...tinyVueRequire.imports,
      ...materialsAndUtilsRequire
    }
  }

  const importStyles = [...blockRequire.importStyles, ...canvasDeps.styles]
  const customEnableTailWindCSS = getMergeMeta('engine.config')?.enableTailwindCSS
  const tailwindURL = getImportUrl('@tailwindcss/browser')
  const importScripts = customEnableTailWindCSS && tailwindURL ? [tailwindURL] : []

  return {
    importMap,
    importStyles,
    importScripts
  }
}