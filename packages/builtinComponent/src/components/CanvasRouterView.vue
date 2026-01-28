<template>
  <canvas-placeholder placeholder="路由子页面显示位置占位符" :data-te-page-id="pageId"></canvas-placeholder>
</template>
<script lang="ts">
import { inject } from 'vue'
import CanvasPlaceholder from './CanvasPlaceholder.vue'
export default {
  components: {
    CanvasPlaceholder
  },
  props: {
    name: {
      type: String
    },
    params: {
      type: Object
    }
  },
  setup() {
    const context = inject('pageContext') as any
    const pageId = context?.pageId

    return { pageId }
  }
}
</script>
