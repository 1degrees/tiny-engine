<template>
  <div :class="{'tiny-engine-toolbar': true, 'active': isShow}">
    <div class="toolbar-left">
      <component :is="Breadcrumb"></component>
    </div>
    <div class="toolbar-center">
      <component :is="ToolbarMedia" :isCanvas="false" @setViewPort="setViewPort"></component>
    </div>
    <div class="toolbar-right">
      <component :is="ChangeLang" :langChannel="previewLangChannel" :options="langOptions"></component>
      <span>
        <tiny-switch v-model="debugSwitch"></tiny-switch>
        <span class="toolbar-button-text">调试模式</span>
      </span>
    </div>
    <div class="toolbar-pos" @click="toggleShow">
        <icon-up-ward />
    </div>
  </div>
</template>

<script lang="jsx">
import { watch, ref, computed } from 'vue'
import { useBreadcrumb, getMergeMeta } from '@opentiny/tiny-engine-meta-register'
import { Switch as TinySwitch } from '@opentiny/vue'
import { iconUpWard } from "@opentiny/vue-icon"
import { constants } from '@opentiny/tiny-engine-utils'
import { BROADCAST_CHANNEL } from '../src/preview/srcFiles/constant'
import { injectDebugSwitch } from './preview/debugSwitch'
import { previewState, updateShowToolbar } from './preview/usePreviewData'
const IconUpWard = iconUpWard()

export default {
  components: {
    TinySwitch,
    IconUpWard
  },
  setup({ emit }) {
    const debugSwitch = injectDebugSwitch()
    const Breadcrumb = getMergeMeta('engine.toolbars.breadcrumb')?.entry
    const ChangeLang = getMergeMeta('engine.toolbars.lang')?.entry
    const langOptions = getMergeMeta('engine.toolbars.lang').options
    const isShow = computed(() => previewState.showToolbar)
    const ToolbarMedia = null // TODO: Media plugin rely on layout/canvas. Further processing is required.
    const { setBreadcrumbPage, setBreadcrumbBlock } = useBreadcrumb()
    const setViewPort = (item) => {
      const iframe = document.getElementsByClassName('iframe-container')[0]
      const app = document.getElementById('app')

      if (iframe) {
        iframe.style.width = item
        iframe.style.margin = 'auto'
      }
      app.style.overflow = 'hidden'
    }

    const toggleShow = () => {
      updateShowToolbar(!isShow.value)
    }

    watch(
      () => previewState.currentPage,
      (newVal) => {
        if (newVal?.page_content?.componentName === constants.COMPONENT_NAME.Block) {
          setBreadcrumbBlock([newVal?.name_cn || newVal?.page_content?.fileName])
        } else {
          setBreadcrumbPage([newVal?.name])
        }
      }
    )

    return {
      previewLangChannel: BROADCAST_CHANNEL.PreviewLang,
      Breadcrumb,
      ChangeLang,
      langOptions,
      ToolbarMedia,
      setViewPort,
      debugSwitch,
      isShow,
      toggleShow
    }
  }
}
</script>

<style lang="less" scoped>
.tiny-engine-toolbar {
  position: relative;
  margin-top: -40px;
  display: flex;
  width: 100%;
  height: var(--base-top-panel-height);
  flex-shrink: 0;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  background-color: var(--te-preview-common-bg-color);
  border-bottom: 1px solid var(--te-preview-common-border-color);
  user-select: none;
  z-index: 1001;
  transition: margin 1s;
}
.active.tiny-engine-toolbar {
  margin-top: -0;
}
.toolbar-left,
.toolbar-right {
  margin: 0 12px;
  display: flex;
  gap: 12px;
}
.toolbar-button-text {
  color: var(--te-preview-common-text-color);
  margin-left: 4px;
  font-size: 12px;
}
:deep(.top-panel-breadcrumb) {
  width: auto;
}
.toolbar-pos {       
  position: absolute;
  right: 0;
  bottom: -20px;
  width: 26px;
  height: 20px;
  cursor: pointer;
  background-color: #fff;
  border-radius: 0 0 12px 12px;
  z-index: 1;
}
.tiny-engine-toolbar .toolbar-pos svg {    
  transform: rotateZ(180deg);
}
.active .toolbar-pos svg {    
  transform: rotateZ(0deg);
}
</style>
