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
      <div v-if="multiple" class="k-select__tags">
        <span class="k-select__placeholder" v-if="selectdOptions.length === 0">{{placeholder}}</span>
        <template v-else>
          <k-tag class="k-select__tag" type="info" v-for="o in selectdOptions" :key="o.value">
            {{o.label}}
            <k-icon type="close" class="k-select__tag-close" v-if="!disabled" @click.stop="removeOption(o.value)"></k-icon></k-tag>
        </template>
      </div>
      <input
        v-else
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
    return {
      inputId,
      selectedLabel,
      selectdOptions,
      popperOption,
      removeOption,
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
.k-select__tags {
  display: flex;
}
.k-select__tag {
  display: flex;
  align-items: center;
  margin-right: 2px;
}
.k-select__tag-close {
  cursor: pointer;
}
.k-select__placeholder {
  color: #777;
}
</style>
