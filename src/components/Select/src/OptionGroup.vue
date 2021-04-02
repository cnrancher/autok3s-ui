<template>
  <div class="k-option-group">
    <div class="k-option-group__label">{{label}}</div>
    <slot></slot>
  </div>
</template>
<script>
import {defineComponent} from 'vue'
export default defineComponent({
  props: {
    label: {
      type: String,
      required: true,
    }
  }
})
</script>
<style>
.k-option-group__label {
  color: var(--sortable-table-group-label);
}
</style>