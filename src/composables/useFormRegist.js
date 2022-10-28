import { inject, onBeforeUnmount } from 'vue'
import { FORM_MANAGE } from '@/utils/constants.js'

export default function useFormRegist(callback, validate) {
  // callback() return [{path: 'a.b' or ['a', 'b'], value: {test: ''}}]
  const { registForm, removeForm, registValidate, removeValidate } = inject(
    FORM_MANAGE,
    () => {
      return {
        registForm() {},
        removeForm() {},
        registValidate() {},
        removeValidate() {}
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
  if (validate) {
    registValidate(validate)
  }
  onBeforeUnmount(() => {
    removeForm(callback)
    if (validate) {
      removeValidate(validate)
    }
  })
}
