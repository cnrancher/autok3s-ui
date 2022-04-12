<template>
  <div class="grid grid-cols-[1fr,auto] gap-10px items-center content-start">
    <h3 class="grid max-w-max col-span-2 grid-flow-col gap-x-10px items-center content-start">
      {{label}}
      <sup v-if="required" class="text-red-500">*</sup>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </k-tooltip>
    </h3>
    <template v-for="(ip, index) in ips" :key="index">
      <k-input :ref="el => { if (el) { inputs[index] = el } }" v-model.trim="ip.value" :readonly="readonly" placeholder="e.g. 192.168.1.22"></k-input>
      <k-icon v-if="!readonly" class="cursor-pointer" type="ashbin" :size="20" @click="remove(index)"></k-icon>
      <div v-else></div>
    </template>
    <div class="col-span-2">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">Add IP Address</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script setup>
import {ref, watch, onBeforeUpdate, nextTick} from 'vue'

const props = defineProps({
  initValue: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false,
  },
  desc: {
    type: String,
    default: ''
  },
  readonly: {
    type: Boolean,
    default: false,
  },
})

const inputs = ref([])
onBeforeUpdate(() => {
  inputs.value = []
})
const ips = ref(props.initValue.split(',').map((ip) => ({ value: ip })))

watch(() => props.initValue, (v) => {
  if (v !== ips.value.map((ip) => ip.value).join(',')) {
    ips.value = props.initValue.split(',').map((ip) => ({ value: ip }))
  }
})
const remove = (index) => {
  ips.value.splice(index, 1)
}
const add = () => {
  ips.value.push({ value: '' })
  nextTick(() => {
    inputs.value[inputs.value.length - 1]?.focus()
  })
}
const getForm = () => {
  return ips.value.map((ip) => ip.value)
}

defineExpose({ getForm })
</script>
