<template>
  <div class="k-pagination__prev"
    :class="{'k-pagination__prev--disabled': prevDisabled}"
    @click="goToPrevPage">
    <span v-if="prevText ">{{ prevText }}</span><k-icon type="arrow-right" direction="left"></k-icon>
  </div>
</template>
<script>
import KIcon from '@/components/Icon'
import { computed, defineComponent } from 'vue'
export default defineComponent({
  name: 'KPrev',
  props: {
    currentPage: {
      type: Number,
      default: 1,
    },
    prevText: {
      type: String,
      default: '',
    },
  },
  emits: ['change-current-page'],
  setup(props, {emit}) {
    const prevDisabled = computed(() => {
      return props.currentPage <= 1
    })
    const goToPrevPage = () => {
      if (prevDisabled.value) {
        return
      }
      emit('change-current-page', props.currentPage - 1)
    }
    return {
      prevDisabled,
      goToPrevPage
    }
  },
  components: {
    KIcon
  }
})
</script>
<style>
.k-pagination__prev {
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}
.k-pagination__prev--disabled {
  cursor: not-allowed;
  & i {
    background-color: var(--disabled-text);
  }
}
</style>