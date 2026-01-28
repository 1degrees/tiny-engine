import { dependencies } from './canvas-dev-external.js'
import { isVaild, replaceOrigins } from './localCdnFile/importMapLocalPlugin.js'

/**
 * 嵌入<script type="importmap">到html头部，并且使用ViteConfig.build.rollupOptions.external排除importmap声明的依赖构建
 * @param {*} importmap <script type="importmap">的结构
 * @param {Array<string>} importMapStyles css样式文件url
 * @returns
 */

export function genHtmlImportmapPlugin({
  importmap,
  importStyles = [],
  externals = []
}) {
  const isException = (source) => {
    for (const external of externals) {
      if (external.test(source) && !isVaild()) {
        return true
      }
    }
    return false
  }
  return {
    name: 'vite-plugin-importmap-runtime',
    config() {
      return {
        build: {
          rollupOptions: {
            external: (source, importer, isResolved) => {
              return isException(source, importer, isResolved)
            },
            output: {
              preserveModuleImports: true,
              // 若需兼容非 ESM 环境（如 UMD），可配置 globals（仅备用）
              globals: Object.keys(importmap.imports).reduce((prev, cur) => {
                prev[cur] = cur
                return prev
              }, {})
            }
          }
        }
      }
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: {
                type: 'importmap'
              },
              children: JSON.stringify(importmap, null, 2),
              injectTo: 'head-prepend'
            },
            ...importStyles.map((url) => ({
              tag: 'link',
              attrs: {
                rel: 'stylesheet',
                href: url
              },
              injectTo: 'head-prepend'
            }))
          ]
        } 
      }
    }
  }
}

export function runtimeExternal(override = {}) {
  const _styles = [...dependencies.ui.importStyles]
  const _scripts = { ...dependencies.base.imports, ...dependencies.ui.imports, ...override }
  const [scripts, styles] = replaceOrigins(_scripts, _styles)
  return [
    genHtmlImportmapPlugin({
      importmap: {
        imports: { ...scripts },
      },
      importStyles: [...styles],
      externals: [
        ...dependencies.base.externals,
        ...dependencies.ui.externals
      ]
    })
  ]
}
