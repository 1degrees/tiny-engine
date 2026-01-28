import { importMapConfig } from '@opentiny/tiny-engine-common/js/importMap'
import { replaceUrl } from '@opentiny/tiny-engine-utils'
import config from '../../../config.ts'

interface ITagProps {
  tag: string
  [key: string]: string
}

export function addTagTask(props: ITagProps) {
  return new Promise((resolve, reject) => {
    const { tag, onload, ...others } = props
    let el: any = document.head.querySelector(`${tag}#${props.id}`)
    let isCreate = !el
    if (!el) {
      el = document.createElement(tag) as any
    }
    for (const key in others) {
      el[key] = others[key] as string
    }
    if (isCreate) {
      document.head.appendChild(el)
    }
    const success = () => {
      resolve(true)
      console.log('添加并加载脚本:', props);
    }
    if (onload) {
      el.onload = success
      el.onerror = reject
    } else {
      setTimeout(() => success())
    }
  })
}

export function appendImportMapTask(imports: ITagProps) {
  const el = document.head.querySelector(`#${IMPORT_MAP_ELEMENT_ID}`)
  const importMap = JSON.parse(el?.textContent || '{}')
  importMap.imports = { ...importMap.imports, ...imports }
  return addTagTask({
    id: IMPORT_MAP_ELEMENT_ID, 
    tag: 'script',  
    type: 'importmap', 
    textContent: JSON.stringify(importMap, null, 2)
  })
}

export const getImportUrl = (pkgName: string) => {
  // 全局配置的map
  const importsMap: any = importMapConfig?.imports
  const stylesMap: any = importMapConfig?.importStyles
  const scriptsMap: any = importMapConfig?.importScripts
  const url = importsMap?.[pkgName] ||
    scriptsMap?.[pkgName] ||
    stylesMap?.[pkgName] 
  return replaceUrl(url)
}
export const IMPORT_MAP_ELEMENT_ID = 'tiny-engine-runtime-import-map'

export function getImportMapData(canvasDeps = { scripts: [], styles: [] }) {
  const tinyVueRequire = {
    imports: {
      // TODO: 后续版本发通知，不再内置物料，需要用户自行引入
      'echarts': getImportUrl('echarts'),
      '@opentiny/vue': getImportUrl('@opentiny/vue'),
      '@opentiny/vue-icon': getImportUrl('@opentiny/vue-icon'),
      '@opentiny/vue-common': getImportUrl('@opentiny/vue-common'),
      '@opentiny/vue-locale': getImportUrl('@opentiny/vue-locale'),
      '@opentiny/tiny-engine-builtin-component': getImportUrl('@opentiny/tiny-engine-builtin-component'),
    },
    importStyles: [getImportUrl('@opentiny/vue-theme')]
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
      ...tinyVueRequire.imports,
      ...materialsAndUtilsRequire
    }
  }

  const importStyles = [...tinyVueRequire.importStyles, ...canvasDeps.styles]
  const tailwindURL = getImportUrl('@tailwindcss/browser')
  const importScripts = config.enableTailwindCSS && tailwindURL ? [tailwindURL] : []

  return {
    importMap,
    importStyles,
    importScripts
  }
}

export async function initImportMap() {
  const { importMap, importStyles, importScripts } = getImportMapData()
  const tasks = []
  const task = addTagTask({ 
    id: IMPORT_MAP_ELEMENT_ID, 
    tag: 'script',  
    type: 'importmap', 
    textContent: JSON.stringify(importMap, null, 2)
  })
  tasks.push(task)
  importStyles.forEach((url) => {
    const task = addTagTask({ 
      tag: 'link', href: url,
      type: config.enableTailwindCSS ? 'text/tailwindcss' : 'text/css',
    })
    tasks.push(task)
  })
  importScripts.forEach((url) => {
    const task = addTagTask({ tag: 'script',  type: 'module', src: url })
    tasks.push(task)
  })
  await Promise.all(tasks)
}