<template>
  <div class="meta-array-wrap">
    <meta-list>
      <template #title>
        <span>
          <label>{{ meta.label?.text?.zh_CN }}</label>
          <tiny-popconfirm 
            title="自动生成列"
            type="info"
            trigger="click"
            message="确定根据数据自动生成表格列信息嘛？&nbsp;&nbsp;&nbsp; 该行为将覆盖原有的表头！"
            @confirm="aiGenColumns"
          >
            <template #reference>
              <IconRefres class="ai-gen" title="根据数据自动生成表格列信息" />
            </template>
          </tiny-popconfirm>
        </span>
      </template>
      <template #items>
        <vue-draggable-next
          :list="itemsOptions.optionsList"
          :disabled="disableDrag"
          handle=".tiny-svg-size"
          @change="dragEnd"
        >
          <div v-for="(item, index) in itemsOptions.optionsList" :key="index">
            <meta-list-item
              :item="item"
              :index="index"
              :dataScource="itemsOptions"
              :currentIndex="state.currentIndex"
              :expand="expand"
              @changeItem="changeItem"
              @deleteItem="deleteItem"
              @editItem="editItem"
            >
              <template #content>
                <span class="item-title">
                  <tiny-input 
                    v-if="!state.editable && state.currentIndex === index"
                    v-model="state.currentTitle" 
                    :autofocus="true"
                    @blur="onBlur"
                    @keyup.enter="onBlur"
                  />
                  <p v-else @click="onEnableEdit(index)">{{ translate(item[itemsOptions.textField]) || item.type }}</p>
                </span>
              </template>
              <template #metaForm>
                <meta-child-item
                  type="array"
                  :meta="meta"
                  :index="index"
                  :arrayIndex="state.currentIndex"
                  @update:modelValue="onValueChange(index, $event)"
                ></meta-child-item>
              </template>
            </meta-list-item>
          </div>
        </vue-draggable-next>
      </template>
      <template #bottom>
        <div class="add" @click="addItem">
          <svg-icon name="add"></svg-icon>
          <span>新增一列</span>
        </div>
      </template>
    </meta-list>
  </div>
</template>

<script>
import { computed, reactive, watch, inject } from 'vue'
import { TinyInput, TinyButton, TinyPopconfirm } from '@opentiny/vue'
import { iconDel, iconEdit, iconRefres } from '@opentiny/vue-icon'
import { MetaList, MetaListItem, MetaChildItem } from '@opentiny/tiny-engine-common'
import { useCanvas, useTranslate } from '@opentiny/tiny-engine-meta-register'
import { VueDraggableNext } from 'vue-draggable-next'
import { utils } from '@opentiny/tiny-engine-utils'
const IconRefres = iconRefres()
const { parseExpression } = utils

export default {
  name: 'ArrayItemConfigurator',
  components: {
    MetaList,
    IconRefres,
    TinyInput,
    TinyButton,
    TinyPopconfirm,
    MetaListItem,
    MetaChildItem,
    VueDraggableNext
  },
  inheritAttrs: false,
  props: {
    meta: {
      type: Object,
      default: () => {}
    },
    expand: {
      type: Boolean,
      default: false
    },
    disableDrag: {
      type: Boolean,
      default: false
    }
  },

  setup(props, { emit }) {
    const columnsList = computed(() => {
      return props.meta.widget.props.modelValue?.value || props.meta.widget.props.modelValue || []
    })

    const itemsOptions = computed(() => ({
      valueField: 'field',
      textField: props.meta.widget.props.textField || 'value',
      textEditable: !!props.meta.widget.props.textEditable,
      btnList: [
        {
          title: '编辑',
          type: 'edit',
          icon: iconEdit()
        },

        {
          title: '删除',
          type: 'delete',
          icon: iconDel()
        }
      ],
      optionsList: columnsList.value,
      name: props.name,
      draggable: true
    }))

    const state = reactive({
      editable: true,
      currentIndex: -1,
      currentTitle: "",
    })

    const editItem = (data) => {
      state.editable = true
      state.currentIndex = data.index
    }

    const updatedColumns = () => {
      emit('update:modelValue', [...columnsList.value])
    }

    const addItem = () => {
      const defaultValue = props.meta.defaultValue?.[0] || null
      const newOption = ['string', 'boolean', 'number'].includes(props.meta.widget.props.type)
        ? defaultValue
        : { ...defaultValue }

      columnsList.value.push(newOption)
      state.currentIndex = columnsList.value.length - 1
      updatedColumns()
    }

    const deleteItem = (params) => {
      columnsList.value.splice(params.index, 1)
      updatedColumns()
    }

    const changeItem = (item) => {
      columnsList.value[item.index] = item.data
      updatedColumns()
    }

    const onValueChange = (index, { propertyKey, propertyValue }) => {
      if (propertyValue === '' || propertyValue === undefined || propertyValue === null) {
        try {
          delete columnsList.value[index][propertyKey]
        } catch {}
      } else {
        columnsList.value[index][propertyKey] = propertyValue
      }
      updatedColumns()
    }

    const dragEnd = () => {
      updatedColumns()
    }

    const translate = useTranslate().translate

    const onEnableEdit = (index) => {
      state.editable = false
      state.currentIndex = index
    }

    const onBlur = () => {
      if (state.editable) return
      const cur = state.currentIndex
      const value = state.currentTitle
      const key = itemsOptions.value?.textField || 'title'
      state.currentIndex = -1
      onValueChange(cur, {
        propertyKey: key,
        propertyValue: value
      })
    }

    const aiGenColumns = () => {
      const columns = [
        { "type": "selection", "width": 40 },
        { "title": "序号", "type": "index", "width": 60 },
      ]
      const { getCurrentSchema, canvasApi } = useCanvas()
      const { props: { data } } = getCurrentSchema()
      const realValues = data?.type === 'JSExpression' ?
        parseExpression(data?.value, canvasApi?.value?.getContext()) : [];
      const row = realValues?.[0]

      if (row && Object.keys(row)?.length) {
        for (const key in row) {
          if (key === '_RID') continue
          const type = row[key]?.children ? 'expand' : typeof row[key] == 'boolean' ? 'radio' : ''
          columns.push({ title: key, field: key, type })
        }
        columnsList.value.splice(0, columnsList.value.length, ...columns)
        updatedColumns()
      }
    }

    watch(() => state.currentIndex, (index) => {
      if (index === -1) {
        state.currentTitle = ''
      } else {
        const item = columnsList.value[index] || {}
        state.currentTitle = translate(item[itemsOptions.value.textField]) || item.type 
      }
    })

    return {
      state,
      itemsOptions,
      columnsList,
      aiGenColumns,
      editItem,
      addItem,
      deleteItem,
      changeItem,
      onValueChange,
      onEnableEdit,
      onBlur,
      translate,
      dragEnd
    }
  }
}
</script>
<style>
.tiny-popconfirm-popover .tiny-popconfirm-popover__container .tiny-popconfirm-popover__content {
  max-width: 260px;
}
</style>
<style lang="less" scoped>
.meta-array-wrap {
  font-size: 12px;
  display: block;
}
.ai-gen {
  margin-left: 8px;
  margin-top: -4px;
  fill: #1576ff;
  cursor: pointer;
}
.item-title {
  margin-right: 8px;
  flex: 1;
  p {
    margin: 0;
    cursor: text;
  }
}
.add {
  display: flex;
  align-items: center;
  color: var(--te-configurator-common-text-color-emphasize);
  margin-top: 4px;
  &:hover {
    cursor: pointer;
  }

  & .svg-icon {
    margin-right: 4px;
  }
}
</style>
