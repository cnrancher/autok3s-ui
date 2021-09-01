import { defineConfig } from 'windicss/helpers'
// import formsPlugin from 'windicss/plugin/forms'
import plugin from 'windicss/plugin'

export default defineConfig({
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lato', 'arial', 'helvetica', 'sans-serif'],
        serif: ['Poppins', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
      },
    },
  },
  // plugins: [formsPlugin],
  // plugins: [
  //   plugin(({ addComponents }) => {
  //     const disabled = {
  //       '.disabled': {
  //         backgroundColor: '#e4e4e7',
  //         cursor: 'not-allowed',
  //         '& label, & input, & select': {
  //           cursor: 'not-allowed'
  //         }
  //       }
  //     }
  //     addComponents(disabled)
  //   })
  // ],
})