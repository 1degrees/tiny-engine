<template>
  <router-view />
</template>
<script setup lang="ts">
import { onMounted } from 'vue'
import { setupAppRoute } from './renderer/app-function/router.ts'

onMounted(() => setupAppRoute())
</script>