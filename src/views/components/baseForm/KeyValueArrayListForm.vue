<template>
  <ArrayListForm ref="kvRef" :init-value="values" v-bind="$attrs" />
</template>

<script setup>
import { ref, computed } from 'vue'
import ArrayListForm from '@/views/components/baseForm/ArrayListForm.vue'

const props = defineProps({
  initValues: {
    type: Object,
    default() {
      return {}
    }
  }
})

const kvRef = ref(null)

const values = computed(() => Object.entries(props.initValues).map(([k, v = '']) => `${k}=${v}`))

const getForm = () => {
  return kvRef.value
    .getForm()
    ?.filter((v) => v?.trim() !== '')
    ?.reduce((t, c) => {
      const [k, v = ''] = c.split('=')
      t[k] = v
      return t
    }, {})
}

defineExpose({ getForm, getValue: getForm })
</script>
