<template>
  <div class="grid grid-cols-[1fr,auto] gap-10px items-center content-start">
    <h3 class="grid col-span-2 grid-flow-col gap-x-10px items-center content-start">
      {{label}}
      <sup v-if="required" class="text-red-500">*</sup>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </k-tooltip>
    </h3>
    <template v-for="(ip, index) in ips" :key="index">
      <k-input :readonly="readonly" v-model.trim="ip.value" @change="debounceUpdate" placeholder="e.g. 192.168.1.22" :ref="el => { if (el) { inputs[index] = el } }"></k-input>
      <k-icon v-if="!readonly" class="cursor-pointer" type="ashbin" @click="remove(index)" :size="20"></k-icon>
      <div v-else></div>
    </template>
    <div class="col-span-2">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">Add IP Address</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script>
import {defineComponent, ref, watch, onBeforeUpdate, nextTick} from 'vue'
import { debounce } from 'lodash-es'
export default defineComponent({
  name: 'IpAddressPoolForm',
  props: {
    modelValue: {
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
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const inputs = ref([])
    onBeforeUpdate(() => {
      inputs.value = []
    })
    const ips = ref(props.modelValue.split(',').map((ip) => ({ value: ip })))
    const update = () => {
      emit('update:modelValue', ips.value.filter((ip) => ip.value).map((ip) => ip.value).join(','))
    }

    watch(() => props.modelValue, (v) => {
      if (v !== ips.value.map((ip) => ip.value).join(',')) {
        ips.value = props.modelValue.split(',').map((ip) => ({ value: ip }))
      }
    })
    const debounceUpdate = debounce(update, 500)
    const remove = (index) => {
      ips.value.splice(index, 1)
      debounceUpdate()
    }
    const add = () => {
      ips.value.push({ value: '' })
      debounceUpdate()
      nextTick(() => {
        inputs.value[inputs.value.length - 1]?.focus()
      })
    }
    const getForm = () => {
      return ips.value.map((ip) => ip.value)
    }
    return {
      inputs,
      ips,
      debounceUpdate,
      remove,
      add,
      getForm,
    }
  },
})
</script>
