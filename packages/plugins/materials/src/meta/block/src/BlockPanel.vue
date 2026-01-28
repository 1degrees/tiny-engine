<template>
  <div class="blocks-wrap">
    <!-- <block-group v-model="state.groups" @changeGroup="changeGroup"></block-group> -->
    <tiny-search v-model="state.searchValue" clearable placeholder="请输入关键字搜索">
      <template #prefix> <tiny-icon-search /> </template>
    </tiny-search>
    <div class="block-list">
      <tiny-collapse v-model="state.activeName" class="lowcode-scrollbar">
        <tiny-collapse-item
          v-for="(item) in groupBlocks"
          :key="item.groupId"
          :title="item.groupName"
          :name="item.groupId"
        >
          <block-list v-model:blockList="item.blocks" :show-add-button="true" :show-block-shot="true"></block-list>
        </tiny-collapse-item>
      </tiny-collapse>
    </div>
  </div>
  <!-- TODO: vue 版本升级到 3.5+ 之后，支持 defer，就不需要 rightPanelRef 了 -->
  <teleport defer to=".material-right-panel" v-if="rightPanelRef">
    <block-group-panel></block-group-panel>
    <block-version-select></block-version-select>
  </teleport>
</template>

<script lang="tsx">
import { onMounted, reactive, watch, provide, computed, watchEffect } from 'vue'
import { Collapse, CollapseItem, Search } from '@opentiny/vue'
import { iconSearch } from '@opentiny/vue-icon'
import { useBlock, useMaterial, useModal, getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'
import BlockGroup from './BlockGroup.vue'
import BlockList from './BlockList.vue'
import BlockGroupPanel from './BlockGroupPanel.vue'
import BlockVersionSelect from './BlockVersionSelect.vue'
import { fetchGroups, fetchGroupBlocksById, fetchGroupBlocksByIds } from './http'
import metaData from '../meta'
import { setBlockPanelVisible, setBlockVersionPanelVisible } from './js/usePanel'

export default {
  components: {
    TinySearch: Search,
    TinyCollapse: Collapse,
    TinyCollapseItem: CollapseItem,
    TinyIconSearch: iconSearch(),
    BlockGroup,
    BlockList,
    BlockGroupPanel,
    BlockVersionSelect
  },
  props: {
    activeTabName: {
      type: String,
      default: ''
    },
    rightPanelRef: Object
  },
  setup(props) {
    const { addDefaultGroup, isDefaultGroupId, isAllGroupId, isRefresh, selectedGroup, getGroupList, setGroupList } =
      useBlock()
    const { materialState } = useMaterial()
    const { message } = useModal()
    const getAppId = () => getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id

    const state = reactive({
      searchValue: '',
      activeName: [],
      groups: [],
      groupData: [],
    })
    const groupBlocks = computed(() => {
      const setBlocks = (data, grops = []) => {
        const defaultGroup = grops.find((item) => item.groupId === 'default')
        data.forEach((block) => {
          const curGroupId = block.groupId || 'default'
          const grop = grops.find((item) => item.groupId === curGroupId) || defaultGroup
          grop?.blocks?.push(block)
        })
        return grops.filter((item) => item.blocks.length > 0)
      }
      const grops = state.groups.map((item) => {
        return {
          groupId: item.value.groupId,
          groupName: item.value.groupName,
          blocks: []
        }
      })
      let bls = state.groupData
      if (state.searchValue) {
        const lowerCaseSearchValue = state.searchValue.toLowerCase()
        bls = state.groupData.filter((block) => {
          const nameCN = block?.name_cn?.toLowerCase?.() ?? ''
          const label = block?.label?.toLowerCase?.() ?? ''
          const description = block?.description?.toLowerCase?.() ?? ''
          return (
            nameCN.includes(lowerCaseSearchValue) ||
            label.includes(lowerCaseSearchValue) ||
            description.includes(lowerCaseSearchValue)
          )
        })
      }
      return setBlocks(bls, grops) 
    })

    const changeGroup = () => {
      state.searchValue = ''
    }

    provide('displayType', 'default')

    // 读取区块
    const fetchBlocks = async (value) => {
      // 设计器默认区块分组的数据从bundle.json取，其他用户自定义分组调接口向数据库查询
      const groupId = selectedGroup.value.groupId
      if (isDefaultGroupId(groupId)) {
        // 默认分组获取内置区块
        const blocks = materialState.blocks[0]?.children || []
        state.groupData = value ? blocks.filter((item) => new RegExp(value, 'i').test(item?.label)) : blocks
        state.groupData.forEach((block) => {
          block.isDefaultGroup = true
        })
      } else if (isAllGroupId(groupId)) {
        const innerBlocks = materialState.blocks[0]?.children || []
        innerBlocks.forEach((item) => {
          item.isDefaultGroup = true
          item.groupName = '默认分组'
        })
        let blocks = []
        try {
          blocks = await fetchGroupBlocksByIds({ groupIds: undefined })
        } catch (error) {
          message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
        }
        state.groupData = [...innerBlocks, ...blocks]
      } else {
        fetchGroupBlocksById({ groupId, value })
          .then((data) => {
            state.groupData = data
            const list = getGroupList()?.map((item) => {
              if (item.id === groupId) {
                item.blocks = data
              }
              return item
            })
            setGroupList(list)
          })
          .catch((error) => {
            state.groupData = []
            message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
          })
      }
    }

    watchEffect(() => {
      state.activeName = state.groups.map((item) => item.value.groupId)
    })

    watch(
      () => selectedGroup.value.groupId,
      // 避免简写带入watch默认参数
      () => fetchBlocks()
    )

    watch(
      () => isRefresh.value,
      (value) => {
        if (value) {
          fetchBlocks()
          isRefresh.value = false
        }
      }
    )

    watch(
      () => props.activeTabName,
      (value) => {
        if (value !== metaData.id) {
          setBlockPanelVisible(false)
          setBlockVersionPanelVisible(false)
        }
      }
    )

    onMounted(() => {
      fetchGroups(getAppId())
        .then((data) => {
          const groups = addDefaultGroup(data)
          state.groups.push(...groups)

          fetchBlocks()
        })
        .catch((error) => {
          message({ message: `获取区块列表失败: ${error.message || error}`, status: 'error' })
        })
    })

    return {
      state,
      groupBlocks,
      changeGroup
    }
  }
}
</script>

<style lang="less" scoped>
.blocks-wrap {
  height: 100%;
  display: flex;
  flex-direction: column;
  .tiny-search {
    padding: 12px;
    border-bottom: 1px solid var(--te-materials-block-panel-border-color);
    :deep(.tiny-input__inner) {
      height: 30px;
    }
  }
  :deep(.tiny-collapse.tiny-collapse .tiny-collapse-item) {
    border-top-color: transparent;
  }
  :deep(.tiny-collapse-item__content) {
    padding: 0 var(--te-common-vertical-form-label-spacing) 4px;
  }

  :deep(.block-list) {
    .block-item {
      color: #ababab;
    }
  }
}

.block-list {
  padding: 0;
  overflow-y: auto;
}
</style>
