<template>
<div class="cluster-tags-form">
  <div class="cluster-tags-form__title">
    Tags
    <k-tooltip v-if="desc">
      <k-icon type="prompt"></k-icon>
      <template #popover>{{desc}}</template>
    </k-tooltip>
  </div>
  <label class="cluster-tags-form__kv-label">Key</label>
  <label class="cluster-tags-form__kv-label">Value</label>
  <div></div>
  <template v-for=" (t, index) in tags" :key="index">
    <k-input :readonly="readonly" v-model.trim="t.label" @change="debounceUpdate" placeholder="e.g. foo"></k-input>
    <k-input :readonly="readonly" v-model.trim="t.value" @change="debounceUpdate" placeholder="e.g. bar"></k-input>
    <k-icon v-if="!readonly" class="cluster-tags-form__remove" type="ashbin" @click="remove(index)" :size="20"></k-icon>
    <div v-else></div>
  </template>
  <div class="cluster-tags-form__actions">
    <k-button v-if="!readonly" type="button" class="btn-sm role-tertiary" @click="add">Add Tag</k-button>
    <div v-else></div>
  </div>
</div>
</template>
<script>
import {defineComponent, ref} from 'vue'
import { debounce } from 'lodash-es'
export default defineComponent({
  name: 'ClusterTagsForm',
  props: {
    modelValue: {
      type: Object,
      default() {
        return {}
      },
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
})
</script>
<style>
.cluster-tags-form {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px 10px;
  align-items: center;
}

.cluster-tags-form__actions, .cluster-tags-form__title {
  grid-column: 1 / span 3;
}
.cluster-tags-form__title {
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
.cluster-tags-form__kv-label {
  color: var(--input-label);
}
.cluster-tags-form__remove {
  cursor: pointer;
}
</style>