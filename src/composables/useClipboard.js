import Clipboard from 'clipboard/dist/clipboard.min.js'
import { unref } from 'vue'

export default function useClipboard(options = { source: '' }) {
  const copy = (text = '') => {
    return new Promise((resolve, reject) => {
      const fakeElement = document.createElement('button')
      const clipboard = new Clipboard(fakeElement, {
        text() {
          return text ? text : unref(options.source)
        }
      })
      clipboard.on('success', (e) => {
        clipboard.destroy()
        resolve(e)
      })
      clipboard.on('error', (e) => {
        clipboard.destroy()
        reject(e)
      })
      document.body.appendChild(fakeElement)
      fakeElement.click()
      document.body.removeChild(fakeElement)
    })
  }

  return {
    copy
  }
}
