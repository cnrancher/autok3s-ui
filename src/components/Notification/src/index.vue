<template>
  <teleport to="body">
    <div class="bg-white fixed grid gap-10px z-$notification-z-index" :class="positionClass">
      <div v-for="item in events" :key="item.id">
        <slot name="body" :event="item">
          <div class="k-notification__content" :class="[`k-notification--${item.type}`]">
            <div class="k-notification__title">{{ item.title }}</div>
            <k-icon class="k-notification__close" type="close" @click="removeEvent(item.id, group)"></k-icon>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div class="k-notification__message" v-html="DOMPurify.sanitize(item.content)"></div>
          </div>
        </slot>
      </div>
    </div>
  </teleport>
</template>
<script>
export default {
  name: 'KNotification'
}
</script>
<script setup>
import { computed } from 'vue'
import KIcon from '@/components/Icon'
import useNotificationStore from '@/store/useNotificationStore.js'
import DOMPurify from 'dompurify'

const props = defineProps({
  position: {
    type: [String, Array],
    default: 'top right'
  },
  closeOnClick: {
    type: Boolean,
    default: true
  },
  group: {
    type: String,
    default: 'default'
  }
})
const positionClass = computed(() => {
  if (typeof props.position === 'string') {
    return [`k-notification--${props.position.split(/\s+/gi).join('-')}`]
  }
  return [`k-notification--${props.position.join('-')}`]
})
const store = useNotificationStore()
store.setGroup(props.group)
const events = computed(() => {
  return store.groupEvents[props.group]
})
const removeEvent = (id, group) => {
  store.removeItem(id, group)
}
</script>
<style>
.k-notification--top-right {
  top: 0;
  right: 0;
  justify-items: end;
}
.k-notification--top-left {
  top: 0;
  left: 0;
  justify-items: start;
}
.k-notification--bottom-left {
  bottom: 0;
  left: 0;
  justify-items: start;
}
.k-notification--bottom-right {
  bottom: 0;
  right: 0;
  justify-items: end;
}
.k-notification--top-center {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
}
.k-notification--bottom-center {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
}
.k-notification__content {
  display: grid;
  grid-template-areas:
    'title close'
    'content content';
  grid-template-columns: 1fr auto;
  row-gap: 10px;
  padding: 10px 10px;
  align-items: center;
  min-width: 300px;
  width: fit-content;
  max-width: 60vw;
  border-left: 5px solid transparent;
}
.k-notification__title {
  grid-area: title;
  font-weight: 600;
}
.k-notification__close {
  grid-area: close;
  cursor: pointer;
}
.k-notification__message {
  grid-area: content;
}
.k-notification--warn,
.k-notification--warning {
  @apply bg-$warning-banner-bg border-l-4px border-$warning;
}
.k-notification--success {
  @apply bg-$success-banner-bg border-l-4px border-$success;
}
.k-notification--error {
  @apply bg-$error-banner-bg border-l-4px border-$error;
}
.k-notification--info {
  @apply bg-$info-banner-bg border-l-4px border-$info;
}
</style>
