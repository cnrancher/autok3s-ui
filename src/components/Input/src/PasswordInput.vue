<template>
  <k-input v-bind="$attrs" :type="inputType" :autocomplete="autocomplete">
    <template #suffix>
      <k-icon class="k-password-input__toggle-view" type="view" v-if="show" :size="18" @click="toggleShow"></k-icon>
      <k-icon class="k-password-input__toggle-view" type="view-off" v-else :size="18" @click="toggleShow"></k-icon>
    </template>
  </k-input>
</template>
<script>
import {computed, defineComponent, ref} from 'vue'
import KInput from './index.vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    autocomplete: {
      type: String,
      default: 'new-password'
    }
  },
  setup() {
    const show = ref(false)
    const inputType = computed(() => {
      return show.value ? 'text' : 'password'
    })
    const toggleShow = () => {
      show.value = !show.value
    }
    
    return {
      show,
      toggleShow,
      inputType,
    }
  },
  components: {
    KInput,
    KIcon
  }
})
</script>
<style>
.k-password-input__toggle-view {
  cursor: pointer;
}
</style>