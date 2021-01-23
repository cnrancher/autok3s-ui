<template>
  <div class="ip-address-pool-form">
    <h3 class="ip-address-pool-form__label">
      {{label}}
      <sup v-if="required" class="k-form-item--required">*</sup>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </h3>
    <template v-for="(ip, index) in ips" :key="index">
      <k-input :readonly="readonly" v-model.trim="ip.value" @change="debounceUpdate" placeholder="e.g. 192.168.1.22"></k-input>
      <k-icon v-if="!readonly" class="ip-address-pool-form__remove" type="ashbin" @click="remove(index)" :size="28"></k-icon>
      <div v-else></div>
    </template>
    <div class="ip-address-pool-form__actions">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">Add IP Address</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script>
import {defineComponent, ref} from 'vue'
import KInput from '@/components/Input'
import KButton from '@/components/Button'
import KIcon from '@/components/Icon'
import Tooltip from '@/components/Tooltip'
import { debounce } from 'lodash-es'
export default defineComponent({
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
    const ips = ref(props.modelValue.split(',').map((ip) => ({ value: ip })))
    const update = () => {
      emit('update:modelValue', ips.value.filter((ip) => ip.value).map((ip) => ip.value).join(','))
    }
    const debounceUpdate = debounce(update, 500)
    const remove = (index) => {
      ips.value.splice(index, 1)
      debounceUpdate()
    }
    const add = () => {
      ips.value.push({ value: '' })
      debounceUpdate()
    }
    return {
      ips,
      debounceUpdate,
      remove,
      add,
    }
  },
  components: {
    KInput,
    KIcon,
    KButton,
    Tooltip
  }
})
</script>
<style>
.ip-address-pool-form {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  row-gap: 10px;
  align-items: center;
  height: fit-content;
}
.ip-address-pool-form__label {
  grid-column: 1 / span 2;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  width: fit-content;
  align-items: center;
}
.ip-address-pool-form__actions {
  grid-column: 1 / span 2;
}
.ip-address-pool-form__remove {
  cursor: pointer;
}
</style>