<template>
  <plugin-panel
    title="全局样式(页面共享)"
    :fixed-name="PLUGIN_NAME.Styled"
    :fixedPanels="fixedPanels"
    :docsUrl="docsUrl"
    :isShowDocsIcon="true"
    @close="$emit('close')"
    class="plugin-page-js-container plugin-script"
  >
    <template #header>
      <span class="icon-wrap">
        <i v-show="state.isChanged" class="red"></i>
        <tiny-button type="primary" @click="saveStyled">保存</tiny-button>
      </span>
    </template>
    <template #content>
      <div class="code-edit-content">
        <monaco-editor
          ref="vsCode"
          language="css"
          :value="state.css"
          :options="options"
          @change="change"
          @shortcutSave="saveStyled"
        ></monaco-editor>
      </div>
    </template>
  </plugin-panel>
</template>

<script lang="ts">
import { onBeforeUnmount, reactive, provide } from 'vue'
import { Button } from '@opentiny/vue'
import { VueMonaco, PluginPanel } from '@opentiny/tiny-engine-common'
import { useHelp, useLayout } from '@opentiny/tiny-engine-meta-register'
import { initCompletion } from '@opentiny/tiny-engine-common/js/completion'
import { initLinter } from '@opentiny/tiny-engine-common/js/linter'
import useStyled, { change, saveStyled, getStyled, close } from './js/styled'

export const api = {
  change, saveStyled, getStyled, close
}

export default {
  components: {
    MonacoEditor: VueMonaco,
    TinyButton: Button,
    PluginPanel
  },
  props: {
    fixedPanels: {
      type: Array
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const docsUrl = useHelp().getDocsUrl('styled')
    const { state, vsCode, change, close, saveStyled } = useStyled({ emit })

    const { PLUGIN_NAME } = useLayout()

    const panelState = reactive({
      emitEvent: emit
    })
    provide('panelState', panelState)

    const options = {
      language: 'css',
      minimap: {
        enabled: false
      },
    }

    return {
      PLUGIN_NAME,
      state,
      vsCode,
      options,
      close,
      change,
      saveStyled,
      docsUrl
    }
  }
}
</script>

<style lang="less" scoped>
.plugin-page-js-container {
  box-shadow: 6px 0px 3px 0px var(--te-plugin-js-panel-shadow-color);
  z-index: 999;

  .icon-wrap {
    position: relative;
    margin-right: 6px;

    .tiny-button {
      min-width: 40px;
      margin-right: 2px;
      height: 24px;
      line-height: 24px;
    }

    .red {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--te-plugin-js-dot-color);
      display: block;
      z-index: 100;
      position: absolute;
      top: -3px;
      right: -1px;
    }
  }

  .code-edit-content {
    padding: 0 12px;
    height: calc(100% - 12px);

    & > div {
      border: 1px solid var(--te-plugin-js-common-border-color);
      border-radius: 4px;
      height: 100%;
    }
  }
}

:deep(.help-box) {
  height: auto;
  #help-icon {
    margin-left: 5px;
  }
}

:deep(.monaco-editor .editorPlaceholder) {
  font-size: 12px !important;
}
</style>
