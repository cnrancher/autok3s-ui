import { inject, onBeforeUnmount } from 'vue'
import { FORM_MANAGE } from '@/utils/constants.js'

export default function useValidateRegist(callback) {
  const { registValidate, removeValidate } = inject(FORM_MANAGE, () => {
    return {
      registValidate() {},
      removeValidate() {}
    }
  })
  const emptyArgs = [
    { arg: registValidate, name: 'registValidateCallback' },
    { arg: removeValidate, name: 'removeValidateCallback' },
    { arg: callback, name: 'callback' }
  ].filter((item) => !item.arg)
  if (emptyArgs.length > 0) {
    console.warn(`${emptyArgs.map((item) => item.name).join(', ')} not provided`)
    return
  }

  registValidate(callback)
  onBeforeUnmount(() => {
    removeValidate(callback)
  })
}
