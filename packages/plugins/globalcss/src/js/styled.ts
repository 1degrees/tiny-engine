/**
 * Copyright (c) 2023 - present TinyEngine Authors.
 * Copyright (c) 2023 - present Huawei Cloud Computing Technologies Co., Ltd.
 *
 * Use of this source code is governed by an MIT-style license.
 *
 * THE OPEN SOURCE SOFTWARE IN THIS PRODUCT IS DISTRIBUTED IN THE HOPE THAT IT WILL BE USEFUL,
 * BUT WITHOUT ANY WARRANTY, WITHOUT EVEN THE IMPLIED WARRANTY OF MERCHANTABILITY OR FITNESS FOR
 * A PARTICULAR PURPOSE. SEE THE APPLICABLE LICENSES FOR MORE DETAILS.
 *
 */

import { ref, reactive, onActivated, nextTick, watch } from 'vue'
import { useResource, useModal, useNotify, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import { isFunction } from '@opentiny/utils'
import { updateGlobalStyle } from './http'
import { formatString } from '@opentiny/tiny-engine-common/js/ast'

const state = reactive({
  css: '',
  isChanged: false,
  hasError: false,
  hasErrorPopup: false
})

const vsCode = ref(null)

export const change = (value) => {
  const lineBreakPattern = /\r\n/g
  // 使用 prettier 格式化之后，换行符会变成 \n
  // vsCode 传入的 value 在 window下，换行符会变成 \r\n
  // 对比需要抹平换行符带来的差异
  state.isChanged = value.replace(lineBreakPattern, '\n') !== state.css.replace(lineBreakPattern, '\n')
}

export const getStyled = () => {
  return useResource().appSchemaState.globalStyle || ''
}

export const saveStyled = async () => {
  const { message } = useModal()
  if (!state.isChanged || state.hasErrorPopup) {
    return false
  }
  const valids = vsCode.value?.validate()
  if (!valids?.success) {
    state.hasErrorPopup = true
    message({
      status: 'error',
      message: valids.message,
      exec: () => {
        state.hasErrorPopup = false
      }
    })
    return false
  }
  const content = formatString(vsCode.value?.getEditor().getValue(), 'css')
  state.css = ''
  await nextTick()
  state.css = content
  state.isChanged = false
  useResource().appSchemaState.globalStyle = content
  const { id } = getMetaApi(META_SERVICE.GlobalService).getBaseInfo()
  await updateGlobalStyle(id, { css: content })
  useNotify({
    type: 'success',
    message: '保存成功！'
  })

  return true
}

export const close = (emit) => (callback) => {
  const { confirm } = useModal()
  const callbackFn = isFunction(callback) ? callback : () => emit('close')
  if (!state.isChanged) {
    callbackFn(true)
    return
  }
  confirm({
    title: '提示',
    message: '有改动未保存，您确定保存并关闭吗？',
    exec() {
      callbackFn(saveStyled())
    },
    cancel() {
      callbackFn(true)
    }
  })
}

export default ({ emit }) => {
  watch(getStyled, (css) => {
    state.css = css
  })

  onActivated(() => {
    nextTick(() => {
      state.css = getStyled()
      vsCode.value?.focus()
      window.dispatchEvent(new Event('resize'))
    })
  })

  return {
    state,
    vsCode,
    change,
    saveStyled,
    close: close(emit)
  }
}
