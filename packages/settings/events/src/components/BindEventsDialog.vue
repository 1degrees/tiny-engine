<template>
  <tiny-dialog-box
    :visible="dialogVisible"
    title="事件绑定"
    width="50%"
    dialog-class="bind-event-dialog"
    draggable
    :append-to-body="true"
    @close="closeDialog"
    @opened="openedDialog"
  >
    <div class="bind-event-dialog-tip">
      <tiny-alert
        type="info"
        class="header-alert"
        :closable="false"
      >
      <template #description>
        <span>
          <tiny-switch class="bind-event-switch" v-model="isQuick" show-text>
            <template #open>
              <span>快捷绑定</span>
            </template>
            <template #close>
              <span>脚本绑定</span>
            </template>
          </tiny-switch>
          {{
            !isQuick ? '选择已有方法或者添加新方法（点击 确定 之后将在JS面板中创建一个该名称的新方法）。' :
            '快捷绑定接口调用、弹出框打开、关闭、页面跳转等操作'
          }}
        </span>
      </template>
      </tiny-alert>
    </div>
    <div class="bind-event-dialog-content">
      <template v-if="isQuick">
        <bind-quick-events v-model="quickValue" />
      </template>
      <template v-else>
        <bind-events-dialog-sidebar :dialogVisible="dialogVisible" :eventBinding="eventBinding"/>
        <bind-events-dialog-content :dialogVisible="dialogVisible"/>
      </template>
    </div>
    <template #footer>
      <div class="bind-dialog-footer">
        <tiny-button @click="closeDialog">取 消</tiny-button>
        <tiny-button type="info" @click="confirm">确 定</tiny-button>
      </div>
    </template>
  </tiny-dialog-box>
</template>

<script>
/* metaService: engine.setting.event.BindEventsDialog */
import { string2Ast } from '@opentiny/tiny-engine-common/js/ast'
import {
  getMergeMeta,
  useCanvas,
  useHistory,
  useLayout,
  getOptions,
  getMetaApi,
  META_APP
} from '@opentiny/tiny-engine-meta-register'
import { utils } from '@opentiny/tiny-engine-utils'
import { Button, Switch, DialogBox, TinyAlert } from '@opentiny/vue'
import { nextTick, provide, reactive, ref } from 'vue'
import MagicString from 'magic-string'
import meta from '../../meta'
import BindEventsDialogSidebar from './BindEventsDialogSidebar.vue'
import BindEventsDialogContent from './BindEventsDialogContent.vue'
import BindQuickEvents from './BindQuickEvents.vue'

const dialogVisible = ref(false)

export const open = () => {
  dialogVisible.value = true
}

export const close = () => {
  dialogVisible.value = false
}

export default {
  components: {
    TinyButton: Button,
    TinySwitch: Switch,
    TinyDialogBox: DialogBox,
    TinyAlert,
    BindEventsDialogSidebar,
    BindEventsDialogContent,
    BindQuickEvents,
  },
  inheritAttrs: false,
  props: {
    eventBinding: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const { PLUGIN_NAME, activePlugin } = useLayout()
    const { pageState, operateNode } = useCanvas()
    const { getMethods, saveMethod, highlightMethod } = getMetaApi(META_APP.Page)
    const { addState } = getMetaApi(META_APP.State)

    const isQuick = ref(false)

    const quickValue = ref({ type: 'query', value: {}, })

    const state = reactive({
      editorContent: '',
      bindMethodInfo: {},
      tip: '',
      tipError: false,
      enableExtraParams: false,
      isValidParams: true
    })

    provide('context', state)

    const switchType = () => {
      isQuick.value = !isQuick.value
    }

    const bindMethod = (data) => {
      if (!data) {
        return
      }

      const eventName = props.eventBinding?.eventName

      if (!eventName) {
        return
      }

      const nodeProps = pageState?.currentSchema?.props

      if (!nodeProps) {
        return
      }

      const { name, extra } = data

      if (!props[eventName]) {
        nodeProps[eventName] = {
          type: 'JSExpression',
          value: ''
        }
      }

      if (extra && state.enableExtraParams) {
        nodeProps[eventName].params = extra
      }

      nodeProps[eventName].value = `this.${name}`

      useHistory().addHistory()
    }

    const resetTipError = () => {
      state.tipError = false
      state.tip = ''
      state.isValidParams = true
    }

    const getExtraParams = () => {
      let extraParams = ''
      if (state.enableExtraParams) {
        try {
          extraParams = JSON.parse(state.editorContent)
          state.isValidParams = Array.isArray(extraParams)
        } catch (error) {
          state.isValidParams = false
        }
      }
      return extraParams
    }

    const getFormatParams = (extraParams) => Array.from({ length: extraParams.length }, (v, i) => `args${i}`).join(',')

    const rewriteMethodParams = (method, name, formatParams, extraParams, enableExtraParams) => {
      const finalParams = enableExtraParams && extraParams.length ? `event,${formatParams}` : formatParams
      const defaultMethod = `function ${name} (${finalParams}) {\n}\n`

      // 没有现存方法，直接拼接一个新的
      if (!method) {
        return defaultMethod
      }

      try {
        const magicStr = new MagicString(method)
        const astStr = string2Ast(method)

        // 解析出来不是函数声明，直接返回默认拼接的函数
        if (astStr?.program?.body[0]?.type !== 'FunctionDeclaration') {
          return defaultMethod
        }

        // 参数数量一致，不需要改写参数，直接返回
        // extraParams.length 是传入的参数数量，+1 是 event 参数
        if (astStr?.program?.body[0].params.length === extraParams.length + 1) {
          return method
        }

        // 参数数量不一致，需要改写参数
        const start = astStr?.program?.body[0].id.end
        const end = astStr?.program?.body[0].body.start
        magicStr.remove(start, end)
        magicStr.appendLeft(start, `(${finalParams})`)
        return magicStr.toString()
      } catch (e) {
        // 尝试改写失败了，直接返回拼接的
        return defaultMethod
      }
    }

    const activePagePlugin = (name) => {
      activePlugin(PLUGIN_NAME.Page).then(() => {
        // 确认js面板渲染完成之后再对目标函数进行高亮处理
        nextTick(() => {
          if (highlightMethod) {
            highlightMethod(name)
          }
        })
      })
    }

    const bindQuickMethod = async () => {
      if (quickValue.value.type === 'query') {
        const name = quickValue.value?.value?.name
        const funName = `${name}Load`
        const stateName = `datasource${utils.capitalize(name)}`
        const methods = getMethods()

        addState(stateName, quickValue.value?.value?.data?.data || [])

        bindMethod({ name: funName })

        if (!methods?.[funName]) {
          const functionStr = `function ${funName}() {
  const { TinyLoading } = this.utils
  const loading = TinyLoading.service({
    customClass: 'fullscreen-loading-auto',
    background: 'rgba(0, 0, 0, 0.1)',
    text: '正在加载数据',
    lock: true,
  })
  this.dataSourceMap.${name}.load(${JSON.stringify(quickValue.value?.value?.data?.options?.params || {}, null, 2)})
  .then(rs => {
    this.state.${stateName} = rs.items
    loading.close()
  })
}
`
          const method = {
            name: funName,
            content: functionStr
          }

          const { beforeSaveMethod } = getOptions(meta.id)

          if (typeof beforeSaveMethod === 'function') {
            await beforeSaveMethod(method, state.bindMethodInfo)
          }

          saveMethod?.(method)
          activePagePlugin()
        }
        close()
      } else if (['openDialog', 'closeDialog'].includes(quickValue.value.type)) {
        const suffix = quickValue.value.type === 'openDialog' ? 'open' : 'close'
        const bindNode = quickValue.value?.value
        const name = `${bindNode?.componentName}${bindNode?.id}`
        const propMap = { TinyModal: 'modelValue', TinyDialogBox: 'visible', TinyDrawer: 'visible' }
        const prop = propMap[bindNode?.componentName] || 'visible'
        const funName = `${suffix}${utils.capitalize(name)}`
        const stateName = bindNode?.props?.[prop]?.value?.includes('this.state.') ?
          bindNode?.props?.[prop]?.value.replace('this.state.', '') : `visibily${utils.capitalize(name)}`

        bindMethod({ name: funName })

        addState(stateName, false)

        const nodeProps = {
          id: bindNode?.id,
          type: 'changeProps',
          value: {
            props: {
              [prop]: {
                model: prop === 'modelValue' ? true : undefined,
                type: 'JSExpression',
                value: `this.state.${stateName}`
              }
            }
          }
        }
        operateNode(nodeProps)

        const methods = getMethods()
        if (!methods?.[funName]) {
          const functionStr = `function ${funName}() {
  // TODO: 关闭/打开弹窗前的业务逻辑放在这里
  this.state.${stateName} = ${suffix === 'open' ? 'true' : 'false'}
}
`
          const method = {
            name: funName,
            content: functionStr
          }
          const { beforeSaveMethod } = getOptions(meta.id)
          if (typeof beforeSaveMethod === 'function') {
            await beforeSaveMethod(method, state.bindMethodInfo)
          }
          saveMethod?.(method)
          activePagePlugin()
        }
        
        close()
      } else if (quickValue.value.type === 'jumpPage') {
        const bindInfo = quickValue.value?.value
        const name = bindInfo?.name
        const funName = `jumpPage${utils.capitalize(name)}`
        bindMethod({ name: funName })
        const methods = getMethods()
        if (!methods?.[funName]) {
          const functionStr = `function ${funName}() {
  // TODO: 跳转页面前的业务逻辑放在这里
  this.router.push(${JSON.stringify(bindInfo)})
}
`
          const method = {
            name: funName,
            content: functionStr
          }
          const { beforeSaveMethod } = getOptions(meta.id)
          if (typeof beforeSaveMethod === 'function') {
            await beforeSaveMethod(method, state.bindMethodInfo)
          }
          saveMethod?.(method)
          activePagePlugin()
        }
        
        close()
      } else if (quickValue.value.type === 'sendMessage') {
        const name = quickValue.value?.value?.name
        const funName = `sendMessage${utils.capitalize(name)}`
        bindMethod({ name: funName })
        const methods = getMethods()
        if (methods?.[funName]) {
          close()
          return
        }

        const functionStr = `function ${funName}() {
  // TODO: 发送消息前的业务逻辑放在这里
  const customEvent = new CustomEvent(${quickValue.value?.value?.name}, {
    detail: {
      message: ${JSON.stringify(quickValue.value?.value?.content, null, 2)},
      type: 'CUSTOM_MESSAGE',
      timestamp: new Date().toLocaleTimeString()
    },
    bubbles: true,       // 事件是否冒泡
    cancelable: true,    // 事件是否可取消
    composed: true       // 事件是否可以穿过 Shadow DOM 边界
  });
  document.dispatchEvent(customEvent);
}
`
        const method = {
          name: funName,
          content: functionStr
        }

        const { beforeSaveMethod } = getOptions(meta.id)

        if (typeof beforeSaveMethod === 'function') {
          await beforeSaveMethod(method, state.bindMethodInfo)
        }

        saveMethod?.(method)

        activePagePlugin()
        
        close()
      } else if (quickValue.value.type === 'receiveMessage') {
      }
    }

    const confirm = async () => {
      if (isQuick.value && Object.keys(quickValue.value.value).length) {
        bindQuickMethod()
        return
      }
      if (state.tipError) {
        return
      }

      let params = 'event'
      const extraParams = getExtraParams()
      let formatParams = params

      if (!state.isValidParams) {
        return
      }

      if (extraParams) {
        params = extraParams.join(',')
        formatParams = getFormatParams(extraParams)
      }

      bindMethod({ ...state.bindMethodInfo, params, extra: extraParams })

      // 需要在bindMethod之后
      const { name } = state.bindMethodInfo
      const methodValue = getMethods()?.[state.bindMethodInfo.name]?.value
      const functionStr = rewriteMethodParams(methodValue, name, formatParams, extraParams, state.enableExtraParams)
      const method = {
        name,
        content: functionStr
      }
      const { beforeSaveMethod } = getOptions(meta.id)

      if (typeof beforeSaveMethod === 'function') {
        await beforeSaveMethod(method, state.bindMethodInfo)
      }

      saveMethod?.(method)

      activePagePlugin(name)
      close()
    }

    const openedDialog = () => {
      state.enableExtraParams = Boolean(props.eventBinding?.params?.length)
      state.editorContent = JSON.stringify(props.eventBinding?.params || [], null, 2)
      resetTipError()
    }

    const closeDialog = () => {
      resetTipError()
      close()
    }

    return {
      state,
      quickValue,
      isQuick,
      dialogVisible,
      confirm,
      closeDialog,
      openedDialog,
      switchType
    }
  }
}
</script>

<style lang="less" scoped>
.bind-event-dialog {
  z-index: 99;
  :deep(.tiny-dialog-box) {
    min-width: 760px;
  }
}

.bind-event-switch {
  width: 72px;
}

.bind-event-dialog-tip {
  .tiny-alert.tiny-alert--normal {
    margin: 12px 0;
  }
}

.bind-event-dialog-content {
  display: flex;
  min-width: 700px;
}
</style>
