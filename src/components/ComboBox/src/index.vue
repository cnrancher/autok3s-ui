<template>
  <div class="k-combo-box" :class="{ disabled: disabled }">
    <div class="k-combo-box__label">
      <label v-if="label" :for="inputId">{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div class="k-combo-box__prefix" v-if="$slots.prefix">
      <slot name="prefix">{{prefix}}</slot>
    </div>
    <dropdown class="k-combo-box__trigger" :option="popperOption" :append-to-body="false" :disabled="disabled" :lazy="false">
      <input
        autocomplete="off"
        :disabled="disabled"
        class="cursor-pointer bg-transparent focus-visible:outline-none overflow-ellipsis"
        :class="[!label ? 'py-9px' : '']"
        :id="inputId"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        v-bind="$attrs"
        :placeholder="placeholder"
        >
      <k-icon v-if="loading" type="loading"></k-icon>
      <k-icon v-else type="arrow-right-blod" direction="down"></k-icon>
      <template #content>
        <div v-if="loading">Loading ...</div>
        <div v-else-if="options.length === 0">No Data</div>
        <div v-else>
          <dropdown-menu-item v-for="(v, index) in options"
            :key="index"
            class="k-combo-box__option"
            :class="[modelValue === v ? 'text-white bg-warm-gray-400': '']"
            @click="setValue(v)">
            {{v}}
        </dropdown-menu-item>
        </div>
      </template>
    </dropdown>
    <div class="k-combo-box__suffix" v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import {useIdGenerator} from '@/utils/idGenerator.js'
const getId = useIdGenerator(0, 'combo-box_');
const useMinWithModifier = (minWith = '200px') => {
  return {
    name: 'selectOptionMinWith',
    enabled: true,
    phase: 'beforeWrite',
    fn: ({ state }) => {
      const w = state.elements.reference.getBoundingClientRect().width
      state.styles.popper['min-width'] = w ? `${w + 18}px` : minWith
    }
  }
}

export default {
  name: 'KComboBox',
  inheritAttrs: false,
}
</script>
<script setup>
import { defineProps, defineEmits, useSlots } from 'vue'
import { Dropdown, DropdownMenuItem }from '@/components/Dropdown'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'

defineProps({
  placeholder: {
    type: String,
    default: 'Please Select...'
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Boolean]
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  class: {
    type: [Array, String, Object]
  },
  desc: {
    type: String,
    default: ''
  },
  options: {
    type: Array,
    default() {
      return []
    }
  }
})

const emit = defineEmits(['update:modelValue'])
const slots = useSlots()
const inputId = getId()
const setValue = (v) => {
  emit('update:modelValue', v)
}
const minWithModifier = useMinWithModifier()
const popperOption = {
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [slots.prefix ? 0 : -10, 8],
      },
    },
    minWithModifier,
  ],
  placement: 'bottom-start'
}
</script>
<style>
.k-combo-box {
  display: grid;
  grid-template-areas: "label label suffix"
                       "prefix select suffix";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  @apply p-8px rounded border;
}
.k-combo-box:not(.disabled):hover {
  @apply bg-gray-100;
}
.k-combo-box__label {
  grid-area: label;
  @apply grid gap-x-10px items-center grid-cols-[max-content,auto] text-warm-gray-500 grid gap-y-10px items-center grid-cols-[max-content,auto];
  width: fit-content;
}
.k-combo-box__prefix {
  grid-area: prefix;
  @apply text-warm-gray-500 self-center;
}
.k-combo-box__suffix {
  grid-area: suffix;
  @apply flex items-center text-warm-gray-500 pl-8px border-l border-warm-gray-600 font-400;
}
.k-combo-box__trigger {
  grid-area: select;
  @apply grid grid-cols-[1fr,auto,auto] items-center;
}

</style>