import { h, defineAsyncComponent, defineComponent } from 'vue'
import { isHTMLTag } from '@vue/shared'
import { getSvgicon } from '@opentiny/vue'
import * as TinyVueIcons from '@opentiny/vue-icon'

import {
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasFlexBox,
  CanvasSection,
  CanvasNavigation,
  FormModel,
  TableModel,
  PageModel
} from '@opentiny/tiny-engine-builtin-component'
import {
  CanvasBox,
  CanvasCollection,
  CanvasIcon,
  CanvasText,
  CanvasSlot,
  CanvasImg,
  CanvasPlaceholder,
  CanvasRouterView,
  CanvasRouterLink
} from '../builtin'
import { getController } from '../canvas-function/controller'
import BlockLoadError from '../BlockLoadError.vue'

export const Mapper: Record<string, any> = {
  Icon: CanvasIcon,
  Text: CanvasText,
  Collection: CanvasCollection,
  div: CanvasBox,
  Slot: CanvasSlot,
  slot: CanvasSlot,
  Template: CanvasBox,
  Img: CanvasImg,
  CanvasSection,
  CanvasFlexBox,
  CanvasRow,
  CanvasCol,
  CanvasRowColContainer,
  CanvasPlaceholder,
  FormModel,
  TableModel,
  PageModel,
  RouterView: CanvasRouterView,
  RouterLink: CanvasRouterLink,
  CanvasNavigation
}
const getNative = (name: string) => {
  return window.TinyLowcodeComponent?.[name]
}

const getBlock = (name: string) => {
  return window.blocks?.[name]
}

const blockComponentsBlobUrlMap = new Map<string, string>()

// TODO: 这里的全局 getter 方法名，可以做成配置化
const loadBlockComponent = async (name: string) => {
  try {
    if (blockComponentsBlobUrlMap.has(name)) {
      return import(/* @vite-ignore */ blockComponentsBlobUrlMap.get(name))
    }

    const blocksBlob = (await getController().getBlockByName(name)) as Array<{ blobURL: string; style: string }>

    for (const [fileName, value] of Object.entries(blocksBlob)) {
      blockComponentsBlobUrlMap.set(fileName, value.blobURL)

      if (!value.style) {
        continue
      }

      // 注册 CSS，以区块为维度
      const stylesheet = document.querySelector(`#${fileName}`)

      if (stylesheet) {
        stylesheet.innerHTML = value.style
      } else {
        const newStylesheet = document.createElement('style')
        newStylesheet.innerHTML = value.style
        newStylesheet.setAttribute('id', fileName)
        document.head.appendChild(newStylesheet)
      }
    }

    return import(/* @vite-ignore */ blockComponentsBlobUrlMap.get(name))
  } catch (error) {
    // 加载错误提示
    return h(BlockLoadError, { name })
  }
}

window.loadBlockComponent = loadBlockComponent

const getBlockComponent = (name: string) => {
  return defineAsyncComponent(() => loadBlockComponent(name))
}

// 移除区块缓存
export const removeBlockCompsCache = () => {
  blockComponentsBlobUrlMap.forEach((_, fileName) => {
    const stylesheet = document.querySelector(`#${fileName}`)
    stylesheet?.remove?.()
  })

  blockComponentsBlobUrlMap.clear()
}

// 获取图标组件
export const getIcon = (name: string) => {
  return defineComponent({
    name: 'Icon',
    render() {
      const { props } = this as any
      return h(CanvasIcon, { name,...props })
    }
  })
}
export const getComponent = (name: string) => {
  return Mapper[name] || getNative(name) || getBlock(name) || (isHTMLTag(name) ? name : getBlockComponent(name))
}
