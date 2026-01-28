<template>
  <div class="guide-line guide-line-x" :style="guideLineX1"></div>
  <div class="guide-line guide-line-x" :style="guideLineX2"></div>
  <div class="guide-line guide-line-y" :style="guideLineY1"></div>
  <div class="guide-line guide-line-y" :style="guideLineY2"></div>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import { useGuideLine } from '../composables/useGuideLine'

const line = useGuideLine().line
const guideLineX1 = computed(() => {
  return {
    top: line.value?.top ? line.value?.top + 'px' : '',
  }
})
const guideLineX2 = computed(() => {
  return {
    top: line.value?.bottom ? line.value?.bottom + 'px' : '',
  }
})
const guideLineY1 = computed(() => {
  return {
    left: line.value?.left ? line.value?.left + 'px' : '',
  }
})
const guideLineY2 = computed(() => {
  return {
    left: line.value?.right ? line.value?.right + 'px' : '',
  }
})
</script>
<style scoped>
.guide-line {
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 1000;
  pointer-events: none;
}

.guide-line-x {
  left: 0;
  top: -10px;
  height: 1px;
  width: 100%;
  border-top: 1px dashed #ff9e80;
}

.guide-line-y {
  top: 0;
  left: -10px;
  width: 1px;
  height: 100%;
  border-left: 1px dashed #ff9e80;
}
</style>
