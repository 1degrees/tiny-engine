<template>
  <div class="meta-select-icon">
    <tiny-popover trigger="manual" v-model="popperShow" popper-class="icon-popover" placement="left">
      <template #reference>
        <div @click="optPopper" aria-haspopup="true" aria-expanded="true" class="lowcode-icon">
          <span class="icon-box" v-if="state.icon.name">
            <component :is="state.icon.component()" />
          </span>
          <span class="icon-text" :title="state.icon.name">{{ state.icon.name || '请选择图标' }}</span>
          <icon-close class="icon-close" v-if="state.icon.name" @click.stop="clearIcon($event)"></icon-close>
        </div>
      </template>
      <div>
        <div class="icon-manage-search">
          <tiny-search
            v-model="state.iconSearchValue"
            clearable
            placeholder="搜索图标"
            @update:modelValue="searchIcon"
          ></tiny-search>
          <span class="icon-manage-clear" v-if="state.icon.name" @click="clearIcon($event)">清空</span>
        </div>
        <ul class="lowcode-icon-list lowcode-scrollbar-thin">
          <li v-for="icon in SvgIConsList" @click="selectIcon(icon)" :key="icon.name">
            <component :is="icon.component()" />
          </li>
        </ul>
      </div>
    </tiny-popover>
  </div>
</template>

<script lang="ts">
import { reactive, ref } from 'vue'
import { TinyPopover, TinySearch, getSvgicon } from '@opentiny/vue'
import { iconClose } from '@opentiny/vue-icon'
import { ALLICONS } from './allicons'

export default {
  components: {
    IconClose: iconClose(),
    TinySearch,
    TinyPopover,
  },
  props: {
    modelValue: {
      type: String,
      default: 'rocket-2-line' // 默认值为空
    }
  },
  setup(props, { emit }) {
    const popperShow = ref(false)
    const state = reactive({
      iconSearchValue: '',
      icon: {
        name: props.modelValue,
        component: () => getSvgicon({ name: props.modelValue || 'rocket-2-line', size: 'mini' })
      },
      defaultIcon: {
        name: props.modelValue,
        component: () => getSvgicon({ name: props.modelValue || 'rocket-2-line', size: 'mini' })
      }
    })

    const optPopper = () => {
      popperShow.value = !popperShow.value
    }

    const selectIcon = (icon) => {
      state.icon = icon
      emit('update:modelValue', icon.name)
      optPopper()
    }

    const clearIcon = (e) => {
      state.icon = ''
      emit('update:modelValue', '')
      optPopper()
    }

    const getSvgs = () =>
      ALLICONS.map((item) => ({
        name: item.name,
        component: () => getSvgicon({ name: item.name, size: 'mini' })
      }))

    const SvgIConsList = ref(getSvgs())
    const iconSearchList = getSvgs()

    const searchIcon = (value) => {
      if (value) {
        SvgIConsList.value = iconSearchList.filter((item) => item.name.toLowerCase().includes(value.toLowerCase()))
      } else {
        SvgIConsList.value = iconSearchList
      }
    }

    return {
      state,
      popperShow,
      optPopper,
      SvgIConsList,
      searchIcon,
      selectIcon,
      clearIcon
    }
  }
}
</script>
<style scoped lang="less">
.lowcode-icon {
  position: relative;
  height: 24px;
  display: flex;
  padding-right: 20px;
  width: 136px;
  cursor: pointer;
  background: var(--te-configurator-select-icon-bg-color);
  color: var(--te-configurator-common-text-color-secondary);
  border: 1px solid var(--te-configurator-common-border-color-divider);
  border-radius: 3px;
  .icon-box {
    border-right: 1px solid var(--te-configurator-common-border-color-divider);
    padding: 0px 8px;
    .tiny-svg {
      color: var(--te-configurator-common-text-color-secondary);
      font-size: 14px;
    }
  }
  .icon-text {
    padding: 4px 0 4px 8px;
    line-height: 14px;
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .icon-close {
    position: absolute;
    right: 4px;
    height: 22px;
    line-height: 14px;
    width: 16px;
    cursor: pointer;
  }
}
.icon-popover {
  .icon-manage-search {
    display: flex;
    align-items: center;
    margin-bottom: 5px;
    .icon-manage-clear {
      display: block;
      color: var(--te-configurator-common-text-color-emphasize);
      min-width: 48px;
      margin-left: 5px;
      cursor: pointer;
    }
  }

  .lowcode-icon-list {
    width: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    height: 320px;
    display: grid;
    padding: 4px;
    grid-template-rows: repeat(7, 30px);
    grid-template-columns: repeat(8, 30px);
    gap: 15px 10px;

    li {
      width: 40px;
      color: var(--te-configurator-common-text-color-secondary);
      cursor: pointer;
      text-align: center;
      .tiny-svg {
        font-size: 24px;
        &:hover {
          color: var(--te-configurator-common-text-color-primary);
        }
      }
    }
  }
}
</style>
