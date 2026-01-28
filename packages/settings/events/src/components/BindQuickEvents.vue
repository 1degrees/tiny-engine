<template>
  <div class="quick-bind-events">
    <div class="quick-bind-events-left">
      <div class="quick-bind-events-title">快速绑定</div>
      <ul class="quick-bind-events-list">
        <li
          v-for="item in quickList"
          @click="changeModel('type', item.type)"
          :class="{active: model.type === item.type}"
          :key="item.type"
        >
            {{ item.name }}
        </li>
      </ul>
    </div>
    <div class="quick-bind-events-right">
      <div class="quick-bind-events-title">绑定内容</div>
      <ul class="quick-bind-events-info">
        <template v-if="model.type === 'query'">
          <li 
            v-for="(item, index) in dataSourceList"
            @click="changeModel('value', item)"
            :class="{active: model.value?.name === item.name}"
            :key="item.id"
          >
            {{ item.name }}  接口
          </li>
        </template>
        <template v-if="['openDialog', 'closeDialog'].includes(model.type)">
          <li 
            v-for="(item, index) in modalList"
            @click="changeModel('value', item)"
            :class="{active: model.value?.id === item.id}"
            :key="item.id"
          >
            {{ modalMap[item.componentName] }} - {{ item.id }} - {{ item.props.title || '' }}
          </li>
        </template>
        <template v-if="model.type === 'jumpPage'">
          <router-select-configurator v-model="model.value" />
        </template>
        <template v-if="model.type === 'sendMessage'">
          <tiny-form :model="model.value" label-width="76px" label-position="top" >
            <tiny-form-item label="消息名称" prop="name">
              <tiny-select v-model="model.value.name" allow-create filterable default-first-option>
                <tiny-option v-for="item in messageOptions" :key="item.value" :label="item.label" :value="item.value"> </tiny-option>
              </tiny-select>
            </tiny-form-item>
            <tiny-form-item label="消息内容(JSON格式)" prop="content">
              <VueMonaco class="monaco" language="json" :options="editorOptions" :value="model.value.content" />
            </tiny-form-item>
          </tiny-form>
        </template>
        <template v-if="model.type === 'receiveMessage'">
          <tiny-form :model="model.value" label-width="76px" label-position="top" >
            <tiny-form-item label="消息名称" prop="name">
              <tiny-select v-model="model.value.name" allow-create filterable default-first-option>
                <tiny-option v-for="item in messageOptions" :key="item.value" :label="item.label" :value="item.value"> </tiny-option>
              </tiny-select>
            </tiny-form-item>
          </tiny-form>
        </template>
      </ul>
    </div>
  </div>
</template>

<script>
/* metaService: engine.setting.event.BindQuickEvents */
import { computed, reactive, ref } from 'vue'
import { VueMonaco } from '@opentiny/tiny-engine-common'
import { RouterSelectConfigurator } from '@opentiny/tiny-engine-configurator'
import { TinyForm, TinyFormItem, TinyInput, TinySelect, TinyOption } from '@opentiny/vue'
import { useResource, getMetaApi, useCanvas, META_SERVICE, META_APP } from '@opentiny/tiny-engine-meta-register'
export default {
  components: {
    VueMonaco,
    RouterSelectConfigurator,
    TinyForm,
    TinyFormItem,
    TinyInput,
    TinySelect,
    TinyOption,
  },
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Object,
      default: () => ({
        type: 'query',
        value: {},
      }),
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {

    const model = ref(props.modelValue)

    const quickList = reactive([
      {
        name: '调用数据源',
        type: 'query',
      },
      {
        name: '打开弹出框',
        type: 'openDialog',
      },
      {
        name: '关闭弹出框',
        type: 'closeDialog',
      },
      {
        name: '跳转至页面',
        type: 'jumpPage',
      },
      {
        name: '发送消息',
        type: 'sendMessage',
      }
    ])

    const dataSourceList = ref(useResource().appSchemaState.dataSource)

    const { pageState: { pageSchema } } = useCanvas()

    const modalList = computed(() => {
      const modalList = []
      const translateChild = (data) => {
        data.forEach((item) => {
          if(['TinyDialogBox', 'TinyModal', 'TinyDrawer'].includes(item.componentName)) {
            modalList.push(item)
          }
          const child = item.children
          if (Array.isArray(child)) {
            translateChild(item.children)
          }
        })
        return data
      }
      translateChild([pageSchema])
      console.log('TinyModal', modalList)
      return modalList
    })

    const modalMap = ref({
      'TinyDialogBox': '对话框',
      'TinyModal': '模态框',
      'TinyDrawer': '抽屉',
    })


    const editorOptions = computed(() => {
      return {
        language: 'javascript',
        lineNumbers: false,
        minimap: {
          enabled: false
        },
      }
    })

    const { getMethods } = getMetaApi(META_APP.Page)

    const messageOptions = computed(() => {
      const methods = getMethods()
      console.log(methods, '-methods-')
      return Object.keys(methods).filter((name) => name.includes('sendMessage'))
        .map((name) => ({
          label: name.replace('sendMessage', ''),
          value: name.replace('sendMessage', ''),
        }))
    })

    const changeModel = (key, value) => {
      model.value[key] = value
      // 切换类型， 清空值
      if (key === 'type') {
        model.value.value = {}
      }
      emit('update:modelValue', model.value) 
    }

    return {
      model,
      changeModel,
      messageOptions,
      editorOptions,
      quickList,
      dataSourceList,
      modalList,
      modalMap,
    }
  }
}
</script>

<style lang="less" scoped>
.quick-bind-events {
  display: flex;
  width: 100%;
  flex-direction: row;

  .monaco {
    margin-left: -26px;
    height: 200px;
  }

  .quick-bind-events-title {
    padding: 0;
    color: var(--te-common-text-secondary);
    font-size: var(--te-base-font-size-base);
  }

  .quick-bind-events-left {
    margin-right: 30px;
    width: 30%;
    
    .quick-bind-events-list {
      display: flex;
      margin-top: 12px;
      height: 296px;
      flex-wrap: wrap;
      flex-direction: column;
      font-size: 14px;
      border-radius: 4px;
      padding: 12px 8px;
      overflow-y: auto;
      border: 1px solid var(--te-configurator-common-border-color-divider);
      li {
        padding: 6px 12px;
        color: var(--te-configurator-common-text-color-secondary);
        cursor: pointer;
        &.active {
          background-color: var(--te-configurator-common-bg-color-active);
        }
      }
    }
  }

  .quick-bind-events-right {
    flex: 1;
    .quick-bind-events-info {
      display: flex;
      height: 296px;
      margin-top: 12px;
      flex-wrap: wrap;
      flex-direction: column;
      font-size: 14px;
      border-radius: 4px;
      padding: 12px 8px;
      overflow-y: auto;
      color: var(--te-configurator-common-text-color-primary);
      border: 1px solid var(--te-configurator-common-border-color-divider);
      li {
        padding: 6px 12px;
        color: var(--te-configurator-common-text-color-secondary);
        cursor: pointer;
        &.active {
          background-color: var(--te-configurator-common-bg-color-active);
        }
      }
    }
  }
}
.footer {
  display: flex;
  justify-content: flex-end;
}
</style>
