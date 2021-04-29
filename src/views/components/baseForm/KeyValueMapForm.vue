<template>
<div class="key-value-map-form">
  <div class="key-value-map-form__title">
    {{label}}
    <tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{desc}}</template>
    </tooltip>
  </div>
  <template v-for=" (t, index) in tags" :key="index">
    <k-input
      :label="keyLabel"
      :readonly="readonly"
      v-model.trim="t.label"
      @change="debounceUpdate"
      placeholder="e.g. foo">
    </k-input>
    <k-input
      :label="valueLabel"
      :readonly="readonly"
      v-model.trim="t.value"
      @change="debounceUpdate"
      placeholder="e.g. bar">
    </k-input>
    <k-icon v-if="!readonly" class="key-value-map-form__remove" type="ashbin" @click="remove(index)" :size="20"></k-icon>
    <div v-else></div>
  </template>
  <div class="key-value-map-form__actions">
    <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">{{actionLabel}}</k-button>
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
      type: Object,
      default() {
        return {}
      },
    },
    label: {
      type: String,
      default: ''
    },
    desc: {
      type: String,
      default: ''
    },
    keyLabel: {
      type: String,
      default: 'Key'
    },
    valueLabel: {
      type: String,
      default: 'Value'
    },
    actionLabel: {
      type: String,
      default: 'Add'
    },
    readonly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, {emit}) {
    const tags = ref(
      Object.entries(props.modelValue ?? {}).map(([label, value]) => ({
      label,
      value,
    })))
    const update = () => {
      emit('update:modelValue', getForm())
    }

    const debounceUpdate = debounce(update, 500)
    const remove = (index) => {
      tags.value.splice(index, 1)
      debounceUpdate()
    }
    const add = () => {
      tags.value.push({ label: '', value: '' })
      debounceUpdate()
    }
    const getForm = () => {
      const f = tags.value.filter((t) => t.label).reduce((t, c) => {
        t[c.label] = c.value
        return t
      }, {})
      if (Object.keys(f).length === 0) {
        return null
      }
      return f
    }
    return {
      tags,
      debounceUpdate,
      remove,
      add,
      getForm,
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
.key-value-map-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px 10px;
  align-items: center;
}

.key-value-map-form__actions, .key-value-map-form__title {
  grid-column: 1 / span 3;
}
.key-value-map-form__title {
  display: grid;
  grid-auto-flow: column;
  column-gap: 10px;
  align-items: center;
  width: fit-content;
  font-size: 18px;
  color: var(--body-text);
  font-weight: 400;
  letter-spacing: 0em;
}

.key-value-map-form__remove {
  cursor: pointer;
}
</style>
