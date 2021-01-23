<template>
  <button class="k-button btn" :disabled="btnDisabled">
    <k-icon v-if="loading" type="loading"></k-icon>
    <slot></slot>
  </button>
</template>
<script>
import {computed, defineComponent} from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    loading: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    }
  },
  setup(props) {
    const btnDisabled = computed(() => {
      return props.disabled || props.loading
    })

    return {
      btnDisabled
    }
  },
  name: 'Button',
  components: {
    KIcon,
  }
})
</script>
<style>
.k-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
}
</style>