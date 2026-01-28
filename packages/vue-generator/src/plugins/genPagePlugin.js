/*
 * @Author: zhang·xiao
 * @Date: 2025-02-11 18:00:58
 * @LastEditors: zhang·xiao
 * @LastEditTime: 2025-04-01 15:49:49
 * @Description: 描述文件功能
 */
import { mergeOptions } from '../utils/mergeOptions'
import { genSFCWithDefaultPlugin } from '../generator'

const defaultOption = {
  pageBasePath: './src/views'
}

function genPagePlugin(options = {}) {
  const realOptions = mergeOptions(defaultOption, options)

  const { pageBasePath, sfcConfig = {} } = realOptions

  return {
    name: 'tinyEngine-generateCode-plugin-page',
    description: 'transform page schema to code',
    /**
     * 将页面 schema 转换成高代码
     * @param {import('@opentiny/tiny-engine-dsl-vue').IAppSchema} schema
     * @returns
     */
    run(schema) {
      const pages = schema.pageSchema

      const resPage = []

      for (const page of pages) {
        let res = ''
        try {
          res = genSFCWithDefaultPlugin(page, schema.componentsMap, sfcConfig)
        } catch (e){
          console.log(e, '--------')
        }
        resPage.push({
          fileType: 'vue',
          fileName: `${page.fileName}.vue`,
          path: `${pageBasePath}/${page.path || ''}`,
          fileContent: res
        })
      }

      return resPage
    }
  }
}

export default genPagePlugin
