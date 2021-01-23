<template>
  <div class="k-select" :class="{ disabled: disabled }">
    <div class="k-select__label">
      <label v-if="label" :for="inputId">{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div class="k-select__prefix" v-if="$slots.prefix">
      <slot name="prefix">{{prefix}}</slot>
    </div>
    <dropdown class="k-select__trigger" :option="popperOption" :append-to-body="false" :disabled="disabled" :lazy="false">
      <input
        autocomplete="off"
        readonly
        :disabled="disabled || loading"
        class="k-select__input"
        :class="{'k-select--no-label': !label}"
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
import {computed, defineComponent, nextTick, onMounted, provide, watch, watchEffect} from 'vue'
import {useIdGenerator} from '@/utils/idGenerator.js'
import { Dropdown }from '@/components/Dropdown'
import KIcon from '@/components/Icon'
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
  name: 'Select',
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
  },
  emits: ['update:modelValue', 'change'],
  setup(props, {emit, slots}) {
    const selectStore = useStore()
    provide('selectStore', selectStore)
    const inputId = getId()
    const selectedLabel = computed(() => {
      return selectStore.getter.activeOption?.label
    })
    watchEffect(() => {
      if (props.modelValue !== undefined && !props.loading ) {
        nextTick(() => {
          const result = selectStore.action.setValue(props.modelValue)
          if (!result) {
            emit('update:modelValue', null)
          }
        })
      }
    })

    watch(() => selectStore.state.value, () => {
      if (selectStore.state.value === props.modelValue) {
        return
      }
      emit('change', selectStore.state.value)
      emit('update:modelValue', selectStore.state.value)
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
    return {
      inputId,
      selectedLabel,
      popperOption,
    }
  },
  components: {
    Dropdown,
    KIcon,
    Tooltip,
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
  padding: 8px 8px;
  background-color: var(--input-bg); 
  border-radius: var(--border-radius);
  border: solid var(--outline-width) var(--input-border);
  color: var(--input-text);
  &:not(.disabled):hover {
    background: var(--input-hover-bg);
  }
}
.k-select__label {
  grid-area: label;
  color: var(--input-label);
  display: grid;
  column-gap: 10px;
  align-items: center;
  grid-template-columns: max-content auto;
  width: fit-content;
}
.k-select__prefix {
  grid-area: prefix;
  color: #6c6c76;
  align-self: center;
}
.k-select__suffix {
  grid-area: suffix;
  font-weight: 400;
  line-height: 1;
  border-left: thin solid #6c6c76;
  padding-left: 8px;
  display: flex;
  align-items: center;
  color: #6c6c76;
}
.k-select__trigger {
  grid-area: select;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
}
.k-select__input {
  cursor: pointer;
  border: none;
  background-color: transparent;
  outline: 0;
  color: var(--input-text);
  text-overflow: ellipsis;
}
.k-select--no-label {
  padding: 9px 0;
}
</style>