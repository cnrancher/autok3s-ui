<template>
<div class="k-form-group">
  <div class="k-form-group__title">
    <slot name="title"></slot>
  </div>
  <div class="k-form-group__closable" v-if="closable" @click="toggleVisible">
    <a>{{visible ? 'Hide':'Show'}}</a>
    <k-icon type="arrow-right" :direction="visible ? 'down' : ''"></k-icon>
  </div>
  <small class="k-form-group__subtitle" v-if="$slots.subtitle"><slot name="subtitle"></slot></small>
  <div class="k-form-group__content" v-show="show">
    <slot></slot>
  </div>
</div>
 
</template>
<script>
import {computed, defineComponent, ref} from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    closable: {
      type: Boolean,
      default: false,
    }
  },
  setup(props) {
    const visible = ref(false)
    const show = computed(() => {
      if (props.closable) {
        return visible.value
      }
      return true
    })
    const toggleVisible = () => {
      visible.value = !visible.value
    }
    return {
      visible,
      show,
      toggleVisible,
    }
  },
  components: {
    KIcon
  }
})
</script>
<style>
.k-form-group {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px 10px;
  align-items: center;
}
.k-form-group__title {
  font-size: 18px;
  color: var(--body-text);
  font-weight: 400;
  letter-spacing: 0em;

}
.k-form-group__closable {
  cursor: pointer;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  justify-content: space-between;
}
.k-form-group__subtitle {
  grid-column: 1 / span 2;
}
.k-form-group__content {
  grid-column: 1 / span 2;
}
</style>