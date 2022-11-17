<template>
  <div class="k-select" :class="[selectClass, { disabled: disabled, focused: visible }]">
    <div class="k-select__label">
      <label v-if="label" :for="inputId">
        {{ label }}
        <sup v-if="required" class="top-0 text-red-500">*</sup>
      </label>
      <tooltip v-if="desc && !visible">
        <k-icon type="prompt"></k-icon>
        <template #popover>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-if="rawDesc" v-html="desc"></span>
          <span v-else>{{ desc }}</span>
        </template>
      </tooltip>
      <div v-else></div>
      <tooltip v-if="error" class="justify-self-end">
        <k-icon type="warning" class="text-red-500" :size="18"></k-icon>
        <template #popover>
          {{ error }}
        </template>
      </tooltip>
    </div>
    <div v-if="$slots.prefix" class="k-select__prefix">
      <slot name="prefix">{{ prefix }}</slot>
    </div>
    <dropdown
      class="k-select__trigger group"
      :option="popperOption"
      :append-to-body="false"
      :disabled="disabled"
      :lazy="false"
      @visible-change="handleVisibleChange"
    >
      <div v-if="multiple" class="flex">
        <span v-if="selectdOptions.length === 0" class="text-warm-gray-400">{{ placeholder }}</span>
        <template v-else>
          <k-tag v-for="o in selectdOptions" :key="o.value" class="flex m-r-2px items-center" type="info">
            {{ o.label }}
            <k-icon v-if="!disabled" type="close" class="cursor-pointer" @click.stop="removeOption(o.value)"></k-icon>
          </k-tag>
        </template>
      </div>
      <input
        v-else
        :id="inputId"
        autocomplete="off"
        readonly
        :disabled="disabled || loading"
        class="bg-transparent cursor-pointer overflow-ellipsis focus-visible:outline-none"
        :class="[!label ? 'py-10.5px px-0' : '', visible ? 'text-warm-gray-400' : '', inputClass]"
        v-bind="$attrs"
        :value="selectedOption?.label"
        :placeholder="placeholder"
      />
      <k-icon v-if="loading" type="loading"></k-icon>
      <template v-else>
        <k-icon type="arrow-right-blod" :class="[clearable ? 'group-hover:hidden' : '']" direction="down"></k-icon>
        <k-icon
          type="close"
          class="hidden"
          :class="[clearable ? 'group-hover:inline-block' : '']"
          @click.stop="clear"
        ></k-icon>
      </template>
      <template #content>
        <slot></slot>
      </template>
    </dropdown>
    <div v-if="$slots.suffix" class="k-select__suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import { useIdGenerator } from '@/utils/idGenerator.js'

const getId = useIdGenerator(0, 'labeled-select_')
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
  name: 'KSelect',
  inheritAttrs: false
}
</script>

<script setup>
import { computed, provide, watch, ref, useSlots, nextTick } from 'vue'

import { Dropdown } from '@/components/Dropdown'
import KIcon from '@/components/Icon'
import KTag from '@/components/Tag'
import Tooltip from '@/components/Tooltip'
import useStore from './store/useStore.js'

const props = defineProps({
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
    default: false
  },
  multiple: {
    type: Boolean,
    default: false
  },
  modelValue: {
    type: [String, Number, Boolean, Array],
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
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
  clearable: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  },
  inputClass: {
    type: [String, Array, Object],
    default: ''
  },
  selectClass: {
    type: [String, Array, Object],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'change'])
const slots = useSlots()
const selectStore = useStore()
provide('selectStore', selectStore)
provide('multiple', props.multiple)
provide('selectEmit', emit)
const inputId = getId()
const selectdOptions = computed(() => {
  const v = props.modelValue
  const selected = selectStore.getter.activeOptions
  if (v && selected) {
    return selected
  }
  if (v) {
    return v.map((item) => ({
      label: `${item}(No Option Matched)`
    }))
  }
  return selected
})
const selectedOption = computed(() => {
  const selected = selectStore.getter.activeOption
  if (selected) {
    return selected
  }
  const v = props.modelValue
  if (v) {
    return {
      label: v
    }
  }
  return selected
})
const clear = () => {
  emit('update:modelValue', '')
  emit('change', '')
}
watch(
  [() => props.modelValue, () => props.loading],
  ([modelValue, loading]) => {
    if (loading) {
      return
    }
    nextTick(() => {
      if (props.multiple) {
        const values = selectStore.state.values
        if (values?.length !== modelValue?.length || values?.some((v) => !modelValue?.includes(v))) {
          selectStore.action.setValues([...modelValue])
        }
        return
      }

      if (modelValue !== selectStore.state.value) {
        selectStore.action.setValue(modelValue)
        return
      }
    })
  },
  {
    immediate: true
  }
)

const minWithModifier = useMinWithModifier()
const popperOption = {
  modifiers: [
    {
      name: 'offset',
      options: {
        offset: [slots.prefix ? 0 : -10, 8]
      }
    },
    minWithModifier
  ],
  placement: 'bottom-start'
}
const removeOption = (v) => {
  const values = [...props.modelValue]
  const i = values.indexOf(v)
  values.splice(i, 1)
  emit('change', values)
  emit('update:modelValue', values)
}

const visible = ref(false)
const handleVisibleChange = (v) => {
  visible.value = v
}
</script>
<style scoped>
.k-select {
  display: grid;
  grid-template-areas:
    'label label suffix'
    'prefix select suffix';
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  @apply border rounded p-8px;
  min-height: 60px;
}
.k-select:not(.disabled, .focused):hover {
  @apply border-$input-hover-border;
}
.k-select__label {
  grid-area: label;
  @apply grid grid-cols-[max-content,20px,auto] text-warm-gray-500 gap-x-10px items-center;
}
.k-select.focused {
  @apply border-$primary;
  & .k-select__label {
    @apply text-$primary;
  }
}
.k-select__prefix {
  grid-area: prefix;
  @apply text-warm-gray-500 self-center;
}
.k-select__suffix {
  grid-area: suffix;
  @apply border-l flex border-warm-gray-600 font-400 pl-8px text-warm-gray-500 leading-1 items-center;
}
.k-select__trigger {
  grid-area: select;
  @apply grid grid-cols-[1fr,auto,auto] items-center;
}
</style>
