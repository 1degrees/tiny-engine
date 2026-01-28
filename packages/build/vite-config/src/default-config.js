import { loadEnv } from 'vite'
import path from 'path'
import vue from '@vitejs/plugin-vue'
import monacoEditorPluginCjs from 'vite-plugin-monaco-editor'
import vueJsx from '@vitejs/plugin-vue-jsx'
import nodeGlobalsPolyfillPluginCjs from '@esbuild-plugins/node-globals-polyfill'
import nodeModulesPolyfillPluginCjs from '@esbuild-plugins/node-modules-polyfill'
import nodePolyfill from 'rollup-plugin-polyfill-node'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import visualizerCjs from 'rollup-plugin-visualizer'
import generateComment from '@opentiny/tiny-engine-vite-plugin-meta-comments'
import { getBaseUrlFromCli, copyBundleDeps, importMapLocalPlugin } from './localCdnFile/index.js'
import { devAliasPlugin } from './vite-plugins/devAliasPlugin.js'
import vitePluginCopyCanvas from './vite-plugins/vitePluginCopyCanvas.js'
import { htmlUpgradeHttpsPlugin } from './vite-plugins/upgradeHttpsPlugin.js'
import { canvasDevExternal } from './canvas-dev-external.js'
import { runtimeExternal } from './runtime-external.js'
import { treeShakingPlugin } from './vite-plugins/treeShakingPlugin.js'
import { copyPreviewImportMap } from './localCdnFile/copyPreviewImportMap.js'

const monacoEditorPlugin = monacoEditorPluginCjs.default
const nodeGlobalsPolyfillPlugin = nodeGlobalsPolyfillPluginCjs.default
const nodeModulesPolyfillPlugin = nodeModulesPolyfillPluginCjs.default
const visualizer = visualizerCjs.default

const getDefaultConfig = (engineConfig) => {
  const {
    root,
    openUrl = '/?type=app&id=1&tenant=1',
    engineOrigin = 'http://172.29.233.140:9090/',
    aipOrigin = 'http://172.31.243.56:7017/',
    aiOrigin = 'http://172.30.210.176:8000/',
    cdnOrigin = 'http://172.31.243.45:8007/',
    inputs = undefined
  } = engineConfig
  const input = inputs || {
    index: path.resolve(process.cwd(), './index.html'),
    preview: path.resolve(process.cwd(), './preview.html'),
    runtime: path.resolve(process.cwd(), './runtime.html')
  }
  return {
    base: './',
    publicDir: path.resolve(root, './public'),
    resolve: {
      extensions: ['.js', '.jsx', '.vue', '.ts', '.tsx'],
      alias: {}
    },
    server: {
      // 这里保证本地启动服务是localhost,支持js多线程和谷歌浏览器读写本地文件api
      port: 8080,
      open: openUrl,
      proxy: {
        '/app-center/v1/api': {
          target: engineOrigin,
          changeOrigin: true
        },
        '/app-center/api': {
          target: engineOrigin,
          changeOrigin: true
        },
        '/material-center/api': {
          target: engineOrigin,
          changeOrigin: true
        },
        '/platform-center/api': {
          target: engineOrigin,
          changeOrigin: true
        },
        '/proxy/api': {
          target: engineOrigin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/proxy\/api/, ''),
        },
        '/aip/assistant': {
          target: aipOrigin,
          changeOrigin: true,
        },
        '/v1/chat': {
          target: aiOrigin,
          changeOrigin: true
        },
        '/tiny-engine': {
          target: cdnOrigin,
          changeOrigin: true,
        }
      }
    },
    preview: {
      host: 'localhost',
      port: 8080,
      open: false
    },
    plugins: [
      generateComment(),
      visualizer({
        filename: 'tmp/report.html',
        title: 'Bundle Analyzer'
      }),
      vue({
        reactivityTransform: path.resolve(root, 'src'),
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith('tiny-i18n-host') || tag.startsWith('ng')
          }
        }
      }),
      vueJsx()
    ],
    optimizeDeps: {
      // 避免  @vue/repl 的 monaco-editor 等依赖被优化掉
      exclude: ['@vue/repl'],
      esbuildOptions: {
        plugins: [
          nodeGlobalsPolyfillPlugin({
            process: true,
            buffer: true
          }),
          nodeModulesPolyfillPlugin()
        ]
      }
    },
    define: {
      'process.env': {}
    },
    build: {
      commonjsOptions: {
        transformMixedEsModules: true,
        // monaco-editor 满足 ESM 规范，防止被误转换
        exclude: ['node_modules/*monaco-editor*/**', 'node_modules/lodash-es/**', 'node_modules/@types/lodash-es/**']
      },
      minify: true,
      sourcemap: false,
      rollupOptions: {
        plugins: [nodePolyfill({ include: null })], // 使用@rollup/plugin-inject的默认值{include: null}, 即在所有代码中生效
        input,
        output: {
          manualChunks: (id) => {
            const chunksMap = {
              monaco: ['node_modules/monaco-editor'],
              prettier: ['node_modules/prettier'],
              vendor: ['node_modules']
            }
            for (const [chunkName, sourcePaths] of Object.entries(chunksMap)) {
              if (sourcePaths.some((item) => id.indexOf(item) > -1)) {
                return chunkName
              }
            }
            return undefined
          }
        }
      }
    }
  }
}

export function useTinyEngineBaseConfig(engineConfig) {
  const { envDir = '', viteConfigEnv, useSourceAlias, assetsDir } = engineConfig
  const { command = 'serve', mode = 'serve' } = viteConfigEnv
  const env = loadEnv(mode, envDir)
  const {
    VITE_CDN_DOMAIN = 'https://unpkg.com',
    VITE_LOCAL_IMPORT_MAPS,
    VITE_LOCAL_BUNDLE_DEPS,
    VITE_LOCAL_IMPORT_PATH
  } = env
  const isLocalImportMap = VITE_LOCAL_IMPORT_MAPS === 'true' // true公共依赖库使用本地打包文件，false公共依赖库使用公共CDN
  const isCopyBundleDeps = VITE_LOCAL_BUNDLE_DEPS === 'true' // true bundle里的cdn依赖处理成本地依赖， false 不处理
  const monacoPublicPath = 'editor/monaco-workers'
  const monacoEditorPluginInstance = monacoEditorPlugin({
    publicPath: monacoPublicPath,
    forceBuildCDN: true,
    customDistPath: (_root, outDir, _base) => path.join(outDir, monacoPublicPath)
  })
  const config = getDefaultConfig(engineConfig)
  if (useSourceAlias) {
    config.plugins.push(
      createSvgIconsPlugin({
        iconDirs: engineConfig.iconDirs || [],
        symbolId: 'icon-[name]',
        inject: 'body-last'
      }),
    )
  }
  config.plugins.push(
    treeShakingPlugin(engineConfig.registryPath),
    monacoEditorPluginInstance,
    htmlUpgradeHttpsPlugin(mode),
    vitePluginCopyCanvas({ useSource: useSourceAlias, assetsDir }),
    devAliasPlugin(env, engineConfig.useSourceAlias)
  )
  if (isCopyBundleDeps) {
    config.plugins.push(copyBundleDeps({
      bundleFile: 'public/mock/bundle.json',
      targetBundleFile: 'mock/bundle.json',
      originCdnPrefix: VITE_CDN_DOMAIN, // mock 中bundle的域名当前和环境的VITE_CDN_DOMAIN一致
      base: getBaseUrlFromCli(config.base)
    }).plugin(command === 'serve'))
  }
  if (isLocalImportMap) {
    config.plugins.push(
      copyPreviewImportMap({
        // FIXME: 相对路径需要修正
        importMapJson: './src/preview/src/preview/importMap.json',
        targetImportMapJson: 'preview-import-map-static/preview-importmap.json',
        originCdnPrefix: VITE_CDN_DOMAIN,
        base: getBaseUrlFromCli(config.base),
        packageCopyLib: [
          // 以下的js存在相对路径引用，不能单独拷贝一个文件，需要整个包拷贝
          '@vue/devtools-api'
        ]
      })
    )
  }

  // 添加本地化CDN插件支持
  if (isLocalImportMap) {
    const logger = console
    logger.log('[local-cdn-plugin]: Initializing local CDN plugin')

    const importMapPlugins = importMapLocalPlugin({
      importMapLocalConfig: engineConfig.importMapLocalConfig,
      base: getBaseUrlFromCli(config.base),
      cdnDir: VITE_LOCAL_IMPORT_PATH
    })

    if (importMapPlugins && importMapPlugins.length > 0) {
      config.plugins.push(...importMapPlugins)
    }
  }

  if (engineConfig.useSourceAlias && command === 'serve') {
    config.plugins.push(canvasDevExternal())
  }

  if (engineConfig.useSourceAlias && command !== 'serve') {
    config.plugins.push(runtimeExternal())
  }

  return config
}
