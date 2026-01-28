import { mergeOptions } from '../utils/mergeOptions'

const defaultOption = {
  fileName: '',
  path: './src/styles'
}

function genGlobalStylePlugin(options = {}) {
  debugger
  const realOptions = mergeOptions(defaultOption, options)

  const { path } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-globalStyle',
    description: 'transform schema to globalStyle',
    /**
     * 转换 globalState
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      let css = schema?.globalStyle || schema?.css || '';
      // css = options.enableTailwindCSS ? "@import 'tailwindcss';\n" + css : css
      return [{
        fileType: 'css',
        fileName: 'index.css',
        path,
        fileContent: css
      }]
    }
  }
}

export default genGlobalStylePlugin
