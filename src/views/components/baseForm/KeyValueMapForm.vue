<template>
  <div class="grid grid-cols-[1fr_1fr_auto] gap-10px items-center">
    <div class="grid col-span-3 grid-flow-col gap-x-10px items-center text-size-18px">
      <slot name="title">
        {{ label }}
        <k-tooltip v-if="desc">
          <k-icon type="prompt"></k-icon>
          <template #popover>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span v-if="rawDesc" v-html="desc"></span>
            <span v-else>{{ desc }}</span>
          </template>
        </k-tooltip>
      </slot>
    </div>
    <template v-for="(t, index) in tags" :key="index">
      <k-input v-model.trim="t.label" :label="keyLabel" :readonly="readonly" placeholder="e.g. foo"></k-input>
      <k-input v-model.trim="t.value" :label="valueLabel" :readonly="readonly" placeholder="e.g. bar"></k-input>
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
  rawDesc: {
    type: Boolean,
    default: true
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

defineExpose({ getValue, getForm: getValue })
</script>
