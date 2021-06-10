<template>
  <div class="k-collapse">
    <slot></slot>
  </div>
</template>
<script>
import {defineComponent, provide, readonly, watchEffect, ref} from 'vue'
export default defineComponent({
  name: 'KCollapse',
  props: {
    accordion: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Array,
      default() {
        return []
      }
    }
  },
  emits: ['update:modelValue', 'change'],
  setup(props, {emit}) {
    const activeNames = ref([])
    watchEffect(() => {
      activeNames.value = [...props.modelValue]
    })
    const toggleActiveName = (name) => {
      const index = activeNames.value.indexOf(name)
      if (props.accordion) {
        if (index > -1) {
          activeNames.value = []
        } else {
          activeNames.value = [name]
        }
      } else {
        if (index > -1) {
          activeNames.value.splice(index, 1)
        } else {
          activeNames.value.push(name)
        }
      }
      emit('update:modelValue', activeNames.value)
      emit('change', activeNames.value)
    }
    provide('activeNames', readonly(activeNames))
    provide('toggleActiveName', toggleActiveName)
  }
})
</script>
<style>
.k-collapse {
  border-top: 1px solid #ebeef5;
  border-bottom: 1px solid #ebeef5
}
</style>