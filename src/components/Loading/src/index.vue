<template>
  <div class="k-loading">
    <div class="k-loading__content">
      <slot></slot>
    </div>
    <div class="k-loading__mask" v-if="loading">
       <k-icon type="loading"></k-icon>Loading...
    </div>
  </div>
</template>
<script>
export default {
  name: 'KLoading',
}
</script>
<script setup>
import KIcon from '@/components/Icon'

defineProps({
  loading: {
    type: Boolean,
    default: true
  }
})
</script>
<style>
.k-loading {
  display: grid;
  grid-template-areas: "content";
}
.k-loading__content {
  grid-area: content;
}
.k-loading__mask {
  grid-area: content;
  align-self: stretch;
  /* width: 100%;
  height: 100%; */
  background-color: hsla(0,0%,100%,.9);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  z-index: var(--loading-z-index);
}
</style>