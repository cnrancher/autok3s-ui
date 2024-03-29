<template>
  <div class="grid grid-cols-[1fr_auto] gap-10px items-center content-start">
    <h4 class="col-span-2 grid grid-flow-col items-center justify-start gap-x-10px">
      <span class="text-size-18px">{{ label }}</span>
      <sup v-if="required" class="text-red-500">*</sup>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </k-tooltip>
    </h4>
    <template v-for="(item, index) in items" :key="index">
      <k-input
        :ref="
          (el) => {
            if (el) {
              inputs[index] = el
            }
          }
        "
        v-model.trim="item.value"
        :readonly="readonly"
        :placeholder="placeholder"
      ></k-input>
      <k-icon v-if="!readonly" class="cursor-pointer" type="ashbin" :size="20" @click="remove(index)"></k-icon>
      <div v-else></div>
    </template>
    <div class="col-span-2">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">{{ actionLabel }}</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script setup>
import { ref, onBeforeUpdate, nextTick, watch } from 'vue'

const props = defineProps({
  initValue: {
    type: Array,
    default() {
      return []
    }
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  desc: {
    type: String,
    default: ''
  },
  rawDesc: {
    type: Boolean,
    default: true
  },
  placeholder: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false
  },
  actionLabel: {
    type: String,
    default: 'Add'
  }
})

const items = ref([])
watch(
  () => props.initValue,
  () => {
    items.value = (props.initValue ?? []).map((v) => ({ value: v }))
  },
  {
    immediate: true
  }
)

const inputs = ref([])
onBeforeUpdate(() => {
  inputs.value = []
})

const remove = (index) => {
  items.value.splice(index, 1)
}
const add = () => {
  items.value.push({ value: '' })
  nextTick(() => {
    inputs.value[inputs.value.length - 1]?.focus()
  })
}

const getValue = () => {
  if (items.value.length === 0) {
    return null
  }
  return items.value.map((item) => item.value)
}

defineExpose({ getValue, getForm: getValue })
</script>
