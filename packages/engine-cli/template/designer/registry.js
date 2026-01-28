import engineConfig from './engine.config'
import { HttpService } from './src/composable'
import { META_SERVICE, META_APP } from '@opentiny/tiny-engine-meta-register'

export default {
  [META_SERVICE.Http]: HttpService,
  'engine.config': {
    ...engineConfig
  },
  // 调整插件顺序示例:
  [META_APP.Layout]: {
    options: {
      relativeLayoutConfig: {
        // // 调整插件顺序
        // [META_APP.OutlineTree]: {
        //   insertAfter: META_APP.Materials
        // },
        // // 调整插件上下位置
        // [META_APP.Schema]: {
        //   insertBefore: META_APP.Help
        // },
        // 调整工具栏顺序
        [META_APP.Save]: {
          insertAfter: META_APP.GenerateCode
        },
        // 支持切换组
        [META_APP.Lang]: {
          insertAfter: META_APP.ViewSetting
        }
      }
    }
  }
}
