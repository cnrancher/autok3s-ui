<template>
  <div class="grid grid-cols-[1fr,1fr,auto] gap-10px items-center">
    <div class="grid col-span-2 grid-flow-col gap-x-10px items-center text-size-18px">
      {{ label }}
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{ desc }}</template>
      </k-tooltip>
    </div>
    <template v-for="(t, index) in tags" :key="index">
      <k-input
        v-model.trim="t.label"
        :label="keyLabel"
        :readonly="readonly"
        placeholder="e.g. foo"
        @change="debounceUpdate"
      ></k-input>
      <k-input
        v-model.trim="t.value"
        :label="valueLabel"
        :readonly="readonly"
        placeholder="e.g. bar"
        @change="debounceUpdate"
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
import { ref } from 'vue'
import { debounce } from 'lodash-es'

const props = defineProps({
  modelValue: {
    type: Object,
    default() {
      return {}
    }
  },
  label: {
    type: String,
    default: ''
  },
  desc: {
    type: String,
    default: ''
  },
  keyLabel: {
    type: String,
    default: 'Key'
  },
  valueLabel: {
    type: String,
    default: 'Value'
  },
  actionLabel: {
    type: String,
    default: 'Add'
  },
  readonly: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const tags = ref(
  Object.entries(props.modelValue ?? {}).map(([label, value]) => ({
    label,
    value
  }))
)
const update = () => {
  emit('update:modelValue', getForm())
}

const debounceUpdate = debounce(update, 500)
const remove = (index) => {
  tags.value.splice(index, 1)
  debounceUpdate()
}
const add = () => {
  tags.value.push({ label: '', value: '' })
  debounceUpdate()
}
const getForm = () => {
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

defineExpose({ getForm })
</script>
