<template>
  <div class="k-input" :class="{ disabled: disabled }">
    <div class="k-input__label">
      <label v-if="label" :for="inputId">{{label}} <sup v-if="required" class="k-form-item--required">*</sup></label>
      <tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </tooltip>
    </div>
    <div class="k-input__prefix" v-if="$slots.prefix">
      <slot name="prefix">{{prefix}}</slot>
    </div>
    <textarea v-if="type==='textarea'"
      class="k-input__textarea"
      :class="{'k-input--no-label': !label}"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :id="inputId"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :rows="rows"
      v-bind="$attrs"
      ref="inputRef"
    ></textarea>
    <input
      v-else
      class="k-input__input"
      :class="{'k-input--no-label': !label}"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :id="inputId"
      :disabled="disabled"
      :autocomplete="autocomplete"
      :type="type"
      v-bind="$attrs"
      ref="inputRef">
    <div class="k-input__suffix" v-if="$slots.suffix">
      <slot name="suffix"></slot>
    </div>
  </div>
</template>
<script>
import {ref, defineComponent} from 'vue'
import Tooltip from '@/components/Tooltip'
import KIcon from '@/components/Icon'
import {useIdGenerator} from '@/utils/idGenerator.js'
const getId = useIdGenerator(0, 'labeled-input_');
export default defineComponent({
  name: 'KInput',
  inheritAttrs: false,
  props: {
    label: {
      type: String,
      default: ''
    },
    required: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: [String, Boolean, Number]
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      default: ''
    },
    autocomplete: {
      type: String,
      default: 'off'
    },
    type: {
      type: String,
      default: 'text'
    },
    rows: {
      type: Number,
      default: 2
    }
  },
  emits: ['update:modelValue'],
  setup() {
    const inputId = getId()
    const inputRef = ref(null)
    const focus = () => {
      inputRef.value?.focus();
    }
    return {
      inputId,
      inputRef,
      focus,
    }
  },
  components: {
    Tooltip,
    KIcon,
  }
})
</script>
<style>

.k-input {
  display: grid;
  grid-template-areas: "label label suffix"
                       "prefix input suffix";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr;
  padding: 8px 8px;
  background-color: var(--input-bg); 
  border-radius: var(--border-radius);
  border: solid var(--outline-width) var(--input-border);
  color: var(--input-text);
  height: fit-content;
  &:not(.disabled)hover {
    background: var(--input-hover-bg);
  }
  
}
.k-input__label {
  grid-area: label;
  color: var(--input-label);
  display: grid;
  column-gap: 10px;
  align-items: center;
  grid-template-columns: max-content auto;
  width: fit-content;
}
.k-input__prefix {
  grid-area: prefix;
  color: #6c6c76;
  align-self: center;
}
.k-input__suffix {
  grid-area: suffix;
  font-weight: 400;
  line-height: 1;
  border-left: thin solid #6c6c76;
  padding-left: 8px;
  display: flex;
  align-items: center;
  color: #6c6c76;
}
input.k-input__input, .k-input__textarea,
input.k-input__input:hover, .k-input__textarea:hover,
input.k-input__input:focus, .k-input__textarea:focus {
  grid-area: input;
  border: none;
  background-color: transparent;
  outline: 0;
  color: var(--input-text);
  padding: 1px 2px;
}

.k-input--no-label {
  padding: 9px 0;
}
</style>