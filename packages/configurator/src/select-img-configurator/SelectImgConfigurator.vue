<template>
  <div class="meta-select-image">
    <tiny-popover trigger="manual" v-model="popperShow" popper-class="icon-popover" placement="left">
      <template #reference>
        <div @click="optPopper" aria-haspopup="true" aria-expanded="true" class="lowcode-image">
          <span class="icon-box" v-if="state.imgSrc">
            <tiny-image :src="state.imgSrc" fit="contain"/>
          </span>
          <span class="icon-text" :title="state.imgSrc">{{ state.imgSrc || '请选择图片' }}</span>
          <icon-copy class="icon-copy" v-if="state.imgSrc" @click.stop="copyImg(state.imgSrc)" ></icon-copy>
          <icon-close class="icon-close" v-if="state.imgSrc" @click="clearImg($event)"></icon-close>
        </div>
      </template>
      <div>
        <div class="icon-manage-search">
          <tiny-search
            v-model="state.imgSearchValue"
            clearable
            placeholder="搜索图片"
            @update:modelValue="searchImg"
          ></tiny-search>
          <span class="icon-manage-clear" v-if="state.imgSrc" @click="clearImg($event)">清空</span>
        </div>
        <ul class="lowcode-img-list lowcode-scrollbar-thin">
          <li class="pre-img" v-for="item in imgsList" :key="item.fileUrl" @click="selectImg(item)">
            <tiny-image :src="item.fileUrl" fit="contain" />
          </li>
          <li class="pre-img">
            <tiny-file-upload 
              list-type="picture-card"
              action="/aip/assistant/api/v1/sketch/resource/upload"
              multiple 
              accept=".png,.jpeg,.jpg,.svg"
              :data="{appId: state.appId, bucket: 'tiny-engine'}"
              :show-file-list="false"
              @success="uploadSuccess"
            >
              <icon-file-upload class="tiny-svg-size icon-fileupload"></icon-file-upload>
            </tiny-file-upload>
          </li>
        </ul>
      </div>
    </tiny-popover>
  </div>
</template>

<script>
import { reactive, ref } from 'vue'
import useClipboard from 'vue-clipboard3'
import { iconClose, iconCopy, iconFileupload } from '@opentiny/vue-icon'
import { TinyImage, TinyFileUpload, Popover, Search, Notify } from '@opentiny/vue'
import { getMetaApi, META_SERVICE } from '@opentiny/tiny-engine-meta-register'

export default {
  components: {
    TinyImage,
    TinyFileUpload,
    TinySearch: Search,
    TinyPopover: Popover,
    IconClose: iconClose(),
    IconCopy: iconCopy(),
    IconFileUpload: iconFileupload()
  },
  props: {
    modelValue: {
      type: String,
      default: '' // 默认值为空
    }
  },
  setup(props, { emit }) {
    const popperShow = ref(false)
    const state = reactive({
      allImgsList: [],
      appId: 0,
      imgSearchValue: '',
      imgSrc: props.modelValue || '',
      defaultSrc: 'https://tinyengine-assets.obs.cn-north-4.myhuaweicloud.com/files/designer-default-icon.jpg'
    })

    const { toClipboard } = useClipboard()
    const appId = getMetaApi(META_SERVICE.GlobalService).getBaseInfo().id
    state.appId = appId;

    const imgsList = ref('');
    const getAllImgsInMino = (appId, bucket = 'tiny-engine') =>
      getMetaApi(META_SERVICE.Http).get(`/aip/assistant/api/v1/sketch/resource/list`, {
        params: {
          bucket,
          appId
        },
      }).then((data = []) => {
        state.allImgsList = data
        imgsList.value = data
      })

    getAllImgsInMino(appId)
    
    const optPopper = () => {
      popperShow.value = !popperShow.value
    }

    const selectImg = (img) => {
      state.imgSrc = img.fileUrl
      emit('update:modelValue', img.fileUrl)
      emit('change', img.fileUrl)
      optPopper()
    }

    const copyImg = async (imgSrc) => {
      try {
        await toClipboard(imgSrc)
        Notify({ type: 'info', message: '复制成功！' })
      } catch (e) {
        Notify({ type: 'error', message: '复制失败，请尝试手动复制！' })
        throw new Error(e)
      }
    }

    const clearImg = (e) => {
      e.stopPropagation()
      state.imgSrc = ''
      emit('update:modelValue', '')
      emit('change', '')
      optPopper()
    }
    const searchImg = (value) => {
      if (value) {
        imgsList.value = state.allImgsList.filter((item) => 
          item.fileUrl.toLowerCase().includes(value.toLowerCase())
        )
      } else {
        imgsList.value = state.allImgsList
      }
    }

    function debounce(func, delay) {
      let timer = null;
      return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => {
          func.apply(this, args);
        }, delay);
      };
    }

    const uploadSuccess = debounce((res) => getAllImgsInMino(appId), 1000)

    return {
      state,
      popperShow,
      optPopper,
      imgsList,
      searchImg,
      selectImg,
      clearImg,
      copyImg,
      uploadSuccess,
    }
  }
}
</script>
<style scoped lang="less">
.lowcode-image {
  position: relative;
  height: 30px;
  display: flex;
  padding-right: 20px;
  width: 100%;
  cursor: pointer;
  background: var(--te-configurator-select-icon-bg-color);
  color: var(--te-configurator-common-text-color-secondary);
  border: 1px solid var(--te-configurator-common-border-color-divider);
  border-radius: 3px;
  .icon-box {
    border-right: 1px solid var(--te-configurator-common-border-color-divider);
    padding: 4px 0;
    .tiny-image {
      width: 24px;
      height: 24px;
    }
  }
  .icon-text {
    display: block;
    padding: 4px 8px 4px 0;
    line-height: 20px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .icon-close {
    position: absolute;
    top: 8px;
    right: 2px;
    width: 16px;
    height: 16px;
    line-height: 14px;
    cursor: pointer;
  }

  .icon-copy {
    position: absolute;
    top: 8px;
    right: 18px;
    width: 14px;
    height: 14px;
    line-height: 14px;
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
      color: #5e7ce0;
      min-width: 48px;
      margin-left: 5px;
      cursor: pointer;
    }
  }

  .lowcode-img-list {
    display: block;
    width: 320px;
    overflow-y: auto;
    overflow-x: hidden;
    height: 320px;
    display: block;
    padding: 4px;

    li {
      display: inline-block;
      margin: 12px 12px 0 0;
      width: 50px;
      height: 50px;
      cursor: pointer;
      text-align: center;
      border-radius: 8px;
      vertical-align: middle;
      background: #deecff;
      color: var(--te-configurator-common-text-color-secondary);
      
      .tiny-image {
        width: 100%;
        height: 100%;
        &:hover {
          color: var(--te-configurator-common-text-color-primary);
        }
      }

      :deep(.tiny-file-upload),
      :deep(.tiny-upload--picture-card) {
        width: 50px;
        height: 50px;
        line-height: 50px;
      }
    }
  }
}
</style>
