<template>
<teleport to="body">
  <div class="k-notification" :class="positionClass">
    <div v-for="item in events" :key="item.id">
      <slot name="body" :event="item">
        <div class="k-notification__content" :class="[`k-notification--${item.type}`]">
          <div class="k-notification__title">{{item.title}}</div>
          <k-icon class="k-notification__close" type="close" @click="removeEvent(item.id, group)"></k-icon>
          <div class="k-notification__message" v-html="item.content">
          </div>
        </div>
      </slot>
    </div>
  </div>
</teleport>
</template>
<script>
import { computed, inject, defineComponent } from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  props: {
    position: {
      type: [String, Array],
      default: 'top right'
    },
    closeOnClick: {
      type: Boolean,
      default: true,
    },
    group: {
      type: String,
      default: 'default',
    }
  },
  setup(props) {
    const positionClass = computed(() => {
      if (typeof props.position === 'string') {
        return [`k-notification--${props.position.split(/\s+/gi).join('-')}`]
      }
      return [`k-notification--${props.position.join('-')}`]
    })
    const store = inject('notificationStore')
    store.action.setGroup(props.group)
    const events = computed(() => {
      return store.state.groupEvents[props.group]
    })
    const removeEvent = (id, group) => {
      store.action.removeItem(id, group)
    }
    return {
      events,
      positionClass,
      removeEvent,
    }
  },
  components: {
    KIcon,
  }
})
</script>
<style>
.k-notification {
  position: fixed;
  display: grid;
  row-gap: 10px;
  z-index: var(--notification-z-index);
}
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
  grid-template-areas: "title close"
                       "content content";
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
.k-notification--warn, .k-notification--warning{
  background: #ffb648;
  color: #fff;
  border-left-color: #f48a06;
}
.k-notification--success {
  background-color: #68cd86;
  color: #fff;
  border-left-color: #42a85f;
}
.k-notification--error {
  background: #e54d42;
  color: #fff;
  border-left-color: #b82e24;
}
.k-notification--info {
  background-color: var(--info);
  color: var(--info-text);
}
</style>