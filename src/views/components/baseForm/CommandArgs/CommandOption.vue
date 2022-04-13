<template>
  <div class="flex items-center gap-x-6px">
    <div class="command-option__flag">
      <code class="bg-gray-100 border">{{ option }}</code>
    </div>
    <div v-if="!flag || choices" class="flex items-center flex-wrap max-w-300px">
      <template v-if="choices">
        <select v-if="!multiple" v-model="value" class="focus-visible:outline-none border rounded">
          <option v-for="v in choices" :key="v.value" :value="v.value">
            {{ v.label }}
          </option>
        </select>
        <template v-else>
          <label
            v-for="(v, index) in values"
            :key="index"
            class="grid items-center grid-cols-[max-content,max-content] gap-x-10px mr-10px"
            @click.stop="handleClick"
          >
            <input v-model="multipleValue" type="checkbox" :value="v" />
            <span>{{ v }}</span>
          </label>
        </template>
      </template>
      <template v-else>
        <input v-model="value" />
      </template>
    </div>
    <k-tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{ desc }}</template>
    </k-tooltip>
  </div>
</template>
<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  desc: {
    type: String,
    default: ''
  },
  alias: {
    type: String,
    default: ''
  },
  long: {
    type: String,
    required: true
  },
  short: {
    type: String,
    default: ''
  },
  values: {
    type: Array,
    default() {
      return []
    }
  },
  multiple: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: ''
  },
  flag: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])
const multipleValue = ref([])
if (props.multiple) {
  multipleValue.value = props.modelValue
    .split(',')
    .filter((v) => v)
    .map((v) => v.trim())
}
watch(multipleValue, (v) => {
  emit('update:modelValue', v.join(','))
})
const value = computed({
  get() {
    return props.modelValue
  },
  set(v) {
    emit('update:modelValue', v)
  }
})
const option = computed(() => {
  if (props.alias) {
    return props.alias
  }
  const o = []
  if (props.long) {
    o.push(props.long)
  }
  if (props.short) {
    o.push(props.short)
  }
  return o.join(' / ')
})
const choices = computed(() => {
  if (!props.values) {
    return
  }
  if (props.flag) {
    return props.values.map((v, i) => ({
      label: v,
      value: i === 0 ? true : false
    }))
  }
  return props.values.map((v) => ({
    label: v,
    value: v
  }))
})
const handleClick = () => {
  // do nothing
}
</script>
