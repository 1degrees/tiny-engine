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

export default (options) => {
  return `
import { createApp } from 'vue'
import router from '@/router/index.js'
import { createPinia } from 'pinia'
import App from '@/App.vue'
import { setKxDesignConfig } from '@opentiny/vue-common-kx'
import './styles/index.css'

const pinia = createPinia()
createApp(App).use(pinia).use(router).mount('#app')
setKxDesignConfig()
console.log('---重置页面主题---', Date.now())
`
}
