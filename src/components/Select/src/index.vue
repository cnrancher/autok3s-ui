<template>
  <div class="k-select" :class="{ disabled: disabled }">
    <div class="k-select__label">
      <label v-if="label" :for="inputId">{{label}} <sup v-if="required" class="text-red-500 top-0">*</sup></label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div class="k-select__prefix" v-if="$slots.prefix">
      <slot name="prefix">{{prefix}}</slot>
    </div>
    <dropdown class="k-select__trigger" :option="popperOption" :append-to-body="false" :disabled="disabled" :lazy="false" @visible-change="handleVisibleChange">
      <div v-if="multiple" class="flex">
        <span class="text-warm-gray-400" v-if="selectdOptions.length === 0">{{placeholder}}</span>
        <template v-else>
          <k-tag class="flex items-center m-r-2px" type="info" v-for="o in selectdOptions" :key="o.value">
            {{o.label}}
            <k-icon type="close" class="cursor-pointer" v-if="!disabled" @click.stop="removeOption(o.value)"></k-icon></k-tag>
        </template>
      </div>
      <input
        v-else
        autocomplete="off"
        readonly
        :disabled="disabled || loading"
        class="cursor-pointer overflow-ellipsis focus-visible:outline-none bg-transparent"
        :class="[!label ? 'py-10.5px px-0' : '', visible ? 'text-warm-gray-400' : '']"
        :id="inputId" v-bind="$attrs"
        :value="selectedLabel"
        :placeholder="placeholder"
        >
      <k-icon v-if="loading" type="loading"></k-icon>
      <k-icon v-else type="arrow-right-blod" direction="down"></k-icon>
      <template #content>
        <slot></slot>
      </template>
    </dropdown>
    <div class="k-select__suffix" v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import {computed, defineComponent, nextTick, provide, watch, ref} from 'vue'
import {useIdGenerator} from '@/utils/idGenerator.js'
import { Dropdown }from '@/components/Dropdown'
import KIcon from '@/components/Icon'
import KTag from '@/components/Tag'
import Tooltip from '@/components/Tooltip'
import useStore from './store/useStore.js'
const getId = useIdGenerator(0, 'labeled-select_');
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
export default defineComponent({
  name: 'KSelect',
  inheritAttrs: false,
  props: {
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
    multiple: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: [String, Number, Boolean, Array]
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
  },
  emits: ['update:modelValue', 'change'],
  setup(props, {emit, slots}) {
    const selectStore = useStore()
    provide('selectStore', selectStore)
    provide('multiple', props.multiple)
    const inputId = getId()
    const selectedLabel = computed(() => {
      return selectStore.getter.activeOption?.label
    })
    const selectdOptions = computed(() => {
      return selectStore.getter.activeOptions
    })
    watch(() => props.loading, (loading) => {
      if (props.modelValue !== undefined && !loading ) {
        nextTick(() => {
          const result = props.multiple ? selectStore.action.setValues([...props.modelValue]) : selectStore.action.setValue(props.modelValue)
          if (!result) {
            emit('update:modelValue', null)
          }
        })
      }
    }, {
      immediate: true
    })

    watch(() => selectStore.state.value, (value) => {
      if (value === props.modelValue) {
        return
      }
      emit('change', value)
      emit('update:modelValue', value)
    })
    watch(() => selectStore.state.values, (values) => {
      if (values?.length === props.modelValue?.length && values?.every((v) => props.modelValue?.includes(v))) {
        return
      }
      emit('change', [...values])
      emit('update:modelValue', [...values])
    }, {
      deep: true
    })
    watch(() => props.modelValue, (modelValue) => {
      if (props.loading) {
        return
      }
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
    const removeOption = (v) => {
      selectStore.action.setValues([v])
    }

    const visible = ref(false)
    const handleVisibleChange = (v) => {
      visible.value = v
    }
    return {
      inputId,
      selectedLabel,
      selectdOptions,
      popperOption,
      removeOption,
      visible,
      handleVisibleChange
    }
  },
  components: {
    Dropdown,
    KIcon,
    Tooltip,
    KTag,
  }
})
</script>
<style>

.k-select {
  display: grid;
  grid-template-areas: "label label suffix"
                       "prefix select suffix";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  @apply p-8px rounded border;
  
}
.k-select:not(.disabled):hover {
  @apply bg-gray-100;
}

.k-select__label {
  grid-area: label;
  @apply text-warm-gray-500 grid gap-y-10px items-center grid-cols-[max-content,auto];
  width: fit-content;
}
.k-select__prefix {
  grid-area: prefix;
  @apply text-warm-gray-500 self-center;
}
.k-select__suffix {
  grid-area: suffix;
  @apply flex items-center text-warm-gray-500 pl-8px border-l border-warm-gray-600 leading-1 font-400;
}
.k-select__trigger {
  grid-area: select;
  @apply grid grid-cols-[1fr,auto,auto] items-center;
}
</style>
