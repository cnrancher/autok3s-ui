<template>
  <teleport to="body">
    <div class="k-modal__overlay" v-if="visible">
      <div class="k-modal">
        <div class="k-modal__header">
          <div class="k-modal__title">
            <slot name="title">
              <span>{{title}}</span>
            </slot>
          </div>
          <k-icon v-if="showClose" type="close" class="k-modal__close" @click="close"></k-icon>
        </div>
         <hr>
        <div class="k-modal__body">
          <slot></slot>
        </div>
        <div class="k-modal__footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </teleport>
</template>
<script>
import { ref, watchEffect, defineComponent } from 'vue'
import KIcon from '@/components/Icon'
export default defineComponent({
  name: 'KModal',
  props: {
    modelValue: {
      type: Boolean,
      required: true,
    },
    showClose: {
      type: Boolean,
      default: false,
    }
  },
  emits: ['update:modelValue'],
  setup(props, context) {
    const {emit} = context
    const visible = ref(false)
    watchEffect(() => {
      visible.value = props.modelValue
    })
    const close = () => {
      emit('update:modelValue', false)
    }
    return {
      visible,
      close,
    }
  },
  components: {
    KIcon,
  }
})
</script>
<style>
.k-modal__overlay {
  position: absolute;
  top: 0; right: 0; bottom: 0; left: 0;
  background-color: rgba(0,0,0,.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: var(--modal-z-index);
}
.k-modal {
  background-color: var(--body-bg);
  min-width: 30%;
}
.k-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 10px;
}
.k-modal__close {
  cursor: pointer;
}
.k-modal__title {
  font-size: 18px;
}
.k-modal__body {
  padding: 30px 20px;
}
.k-modal__footer {
  padding: 10px 20px 20px;
  display: grid;
  column-gap: 10px;
  grid-auto-flow: column;
  align-items: center;
  justify-content: end;
}
</style>