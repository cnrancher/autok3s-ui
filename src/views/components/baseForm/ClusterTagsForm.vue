<template>
  <div class="grid grid-cols-[1fr,1fr,auto] gap-10px items-center">
    <div class="grid grid-flow-col gap-10px items-center justify-start col-span-3">
      <span class="text-size-18px">Tags</span>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </k-tooltip>
    </div>
    <label class="text-gray-500">Key</label>
    <label class="text-gray-500">Value</label>
    <div></div>
    <template v-for="(t, index) in tags" :key="index">
      <k-input v-model.trim="t.label" :readonly="readonly" placeholder="e.g. foo"></k-input>
      <k-input v-model.trim="t.value" :readonly="readonly" placeholder="e.g. bar"></k-input>
      <k-icon v-if="!readonly" class="cursor-pointer" type="ashbin" :size="20" @click="remove(index)"></k-icon>
      <div v-else></div>
    </template>
    <div class="col-span-3">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">Add Tag</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {}
    }
  },
  desc: {
    type: String,
    default: ''
  },
  rawDesc: {
    type: Boolean,
    default: true
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const tags = ref(
  Object.entries(props.modelValue ?? {}).map(([label, value]) => ({
    label,
    value
  }))
)
const remove = (index) => {
  tags.value.splice(index, 1)
}
const add = () => {
  tags.value.push({ label: '', value: '' })
}
const getValue = () => {
  const f = tags.value
    .filter((t) => t.label)
    .reduce((t, c) => {
      t[c.label] = c.value
      return t
    }, {})
  if (Object.keys(f).length === 0) {
    return null
  }
  return f
}
defineExpose({ getValue })
</script>
