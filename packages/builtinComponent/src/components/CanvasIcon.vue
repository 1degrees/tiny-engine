<script lang="ts">
import * as SvgIcons from '@opentiny/vue-icon'
import { getSvgicon } from '@opentiny/vue'
import { h, computed } from 'vue'

export default {
  props: {
    name: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const TinyIcons = SvgIcons as any;
    const Icon = computed(() => {
      return TinyIcons[props.name] ? TinyIcons[props.name]() : getSvgicon({ name: props.name, size: props.size })
    })
    return () =>
      h('span', { class: 'iconwarp' }, [
        h(Icon.value) || '错误图标'
      ])
  }
}
</script>

<style scoped>
.iconwarp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  fill: currentColor;
  min-width: 24px;
  min-height: 24px;
}
</style>
