import { withInstall } from '@/components/util'
import input from './src/index.vue'
import passwordInput from './src/PasswordInput.vue'

const Input = withInstall(input)
const PasswordInput = withInstall(passwordInput)

export { PasswordInput, Input }
export default Input
