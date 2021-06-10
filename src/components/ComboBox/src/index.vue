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
        class="k-combo-box__input"
        :class="{'k-combo-box--no-label': !label}"
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
            :class="{'k-combo-box--selected': modelValue === v}"
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
import {computed, defineComponent, ref} from 'vue'
import { Dropdown, DropdownMenuItem }from '@/components/Dropdown'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'
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
export default defineComponent({
  name: 'KComboBox',
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
    options: {
      type: Array,
      default() {
        return []
      }
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit, slots}) {
    // const filteredOptions = computed(() => {
    //   if (!props.modelValue) {
    //     return props.options
    //   }
    //   return props.options.filter((v) => props.modelValue.indexOf(v) > -1)
    // })
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
    return {
      inputId,
      setValue,
      popperOption,
      // filteredOptions,
    }
  },
  components: {
    Dropdown,
    DropdownMenuItem,
    Tooltip,
    KIcon,
  }
})
</script>
<style>
.k-combo-box {
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
.k-combo-box__label {
  grid-area: label;
  color: var(--input-label);
  display: grid;
  column-gap: 10px;
  align-items: center;
  grid-template-columns: max-content auto;
  width: fit-content;
}
.k-combo-box__prefix {
  grid-area: prefix;
  color: #6c6c76;
  align-self: center;
}
.k-combo-box__suffix {
  grid-area: suffix;
  font-weight: 400;
  line-height: 1;
  border-left: thin solid #6c6c76;
  padding-left: 8px;
  display: flex;
  align-items: center;
  color: #6c6c76;
}
.k-combo-box__trigger {
  grid-area: select;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
}
.k-combo-box__input {
  cursor: pointer;
  border: none;
  background-color: transparent;
  outline: 0;
  color: var(--input-text);
  text-overflow: ellipsis;
}
.k-combo-box--no-label {
  padding: 9px 0;
}
.k-combo-box--selected {
  background-color: var(--dropdown-active-bg);
  color: var(--dropdown-active-text);
}
</style>