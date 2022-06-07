import { inject, onBeforeUnmount } from 'vue'
import { FORM_MANAGE } from '@/utils/constants.js'

export default function useFormRegist(callback) {
  // callback() return [{path: 'a.b' or ['a', 'b'], value: {test: ''}}]
  const { registForm, removeForm } = inject(
    FORM_MANAGE,
    () => {
      return {
        registForm() {},
        removeForm() {}
      }
    },
    true
  )

  const emptyArgs = [
    { arg: registForm, name: 'registFormCallback' },
    { arg: removeForm, name: 'removeFormCallback' },
    { arg: callback, name: 'callback' }
  ].filter((item) => !item.arg)

  if (emptyArgs.length > 0) {
    console.warn(`${emptyArgs.map((item) => item.name).join(', ')} not provided`)
  }
  registForm(callback)
  onBeforeUnmount(() => {
    removeForm(callback)
  })
}
