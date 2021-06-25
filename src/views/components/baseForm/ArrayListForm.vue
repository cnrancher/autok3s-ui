<template>
  <div class="array-list-form">
    <h4 class="array-list-form__label">
      {{label}}
      <sup v-if="required" class="k-form-item--required">*</sup>
      <k-tooltip v-if="desc">
        <k-icon type="prompt"></k-icon>
        <template #popover>{{desc}}</template>
      </k-tooltip>
    </h4>
    <template v-for="(item, index) in items" :key="index">
      <k-input :readonly="readonly" v-model.trim="item.value" @input="debounceUpdate" :placeholder="placeholder" :ref="el => { if (el) { inputs[index] = el } }"></k-input>
      <k-icon v-if="!readonly" class="array-list-form__remove" type="ashbin" @click="remove(index)" :size="20"></k-icon>
      <div v-else></div>
    </template>
    <div class="array-list-form__actions">
      <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">{{actionLabel}}</k-button>
      <div v-else></div>
    </div>
  </div>
</template>
<script>
import {defineComponent, ref, onBeforeUpdate, nextTick} from 'vue'
import { debounce } from 'lodash-es'
export default defineComponent({
  name: 'ArrayListForm',
  props: {
    modelValue: {
      type: Array,
      default() {
        return []
      },
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
    placeholder: {
      type: String,
      default: ''
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    actionLabel: {
      type: String,
      default: 'Add'
    }
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const items = ref((props.modelValue ?? []).map((v) => ({ value: v })))
    const inputs = ref([])
    onBeforeUpdate(() => {
      inputs.value = []
    })
    const update = () => {
      emit('update:modelValue', items.value.map((item) => item.value))
    }
    const debounceUpdate = debounce(update, 300)
    const remove = (index) => {
      items.value.splice(index, 1)
      debounceUpdate()
    }
    const add = () => {
      items.value.push({ value: '' })
      debounceUpdate()
      nextTick(() => {
        inputs.value[inputs.value.length - 1]?.focus()
      })
    }
    const getForm = () => {
      if (items.value.length === 0) {
        return null
      }
      return items.value.map((item) => item.value)
    }
    return {
      items,
      inputs,
      debounceUpdate,
      remove,
      add,
      getForm,
    }
  },
})
</script>
<style>
.array-list-form {
  display: grid;
  grid-template-columns: 1fr auto;
  column-gap: 10px;
  row-gap: 10px;
  align-items: center;
  height: fit-content;
}
.array-list-form__label {
  grid-column: 1 / span 2;
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  width: fit-content;
  align-items: center;
  margin-bottom: 0;
}
.array-list-form__actions {
  grid-column: 1 / span 2;
}
.array-list-form__remove {
  cursor: pointer;
}
</style>