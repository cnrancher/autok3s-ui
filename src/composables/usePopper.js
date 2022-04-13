import { unref } from 'vue'
import { createPopper } from '@popperjs/core'
import { onBeforeUnmount } from 'vue'
// import { createPopper } from '@popperjs/core/lib/popper-lite'
// import {
//   popperGenerator,
//   defaultModifiers,
// } from '@popperjs/core/lib/popper-lite'
// import flip from '@popperjs/core/lib/modifiers/flip'
// import preventOverflow from '@popperjs/core/lib/modifiers/preventOverflow'
// import { onBeforeUnmount, unref } from 'vue'
// const createPopper = popperGenerator({
//   defaultModifiers: [...defaultModifiers, flip, preventOverflow],
// });

export default function usePopper(target, content, option = { placement: 'bottom' }) {
  let instance = null
  const create = () => {
    if (instance) {
      return
    }
    instance = createPopper(unref(target), unref(content), option)
  }
  const remove = () => {
    instance?.destroy()
    instance = null
  }
  const update = () => {
    instance?.update()
  }
  onBeforeUnmount(remove)
  return {
    remove,
    update,
    create
  }
}
