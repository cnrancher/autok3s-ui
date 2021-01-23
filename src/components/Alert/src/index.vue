<template>
  <div class="k-alert" v-show="visible" :class="typeClass">
    <div class="k-alert__title"><slot>{{title}}</slot></div>
    <div class="k-alert__close" v-if="closable"><k-icon type="close"></k-icon></div>
    <div class="k-alert-desc" v-if="description">{{description}}</div>
  </div>
</template>
<script>
import {computed, defineComponent, ref} from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  name: 'Alert',
  props: {
    title: {
      type: String,
      required: true
    },
    closable: {
      type: Boolean,
      default: false
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'success'
    }
  },
  emits: ['close'],
  setup(props, {emit}) {
    const visible = ref(true)

    const close = (e) => {
      visible.value = false
      emit('close', e)
    }
    const typeClass = computed(() => `k-alert--${props.type}`)
    return {
      visible,
      close,
      typeClass,
    }
  },
  components: {
    KIcon
  }
})
</script>
<style>
.k-alert {
  display: grid;
  grid-template-areas: "title close"
                       "desc desc";
  grid-template-columns: 1fr 28px;
  align-items: center;
  padding: 10px;
  margin: 15px 0;
  border-radius: var(--border-radius);

}
.k-alert__title {
  grid-area: title;
}
.k-alert__close {
  grid-area: close;
}
.k-alert__desc {
  grid-area: desc;
}

.k-alert--success {
  background: var(--success-banner-bg);
  border: solid 1px var(--success);
  color: var(--body-text);
}

.k-alert--info {
  background: var(--info-banner-bg);
  border: solid 1px var(--info);
  color: var(--body-text);
}

.k-alert--warning {
  background: var(--warning-banner-bg);
  border: solid 1px var(--warning);
  color: var(--body-text);
}

.k-alert--error {
  background: var(--error-banner-bg);
  border: solid 1px var(--error);
  color: var(--error);
}
</style>