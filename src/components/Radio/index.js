import { withInstall } from '@/components/util'
import radio from './src/Radio.vue'
import radioButton from './src/RadioButton.vue'
import radioGroup from './src/RadioGroup.vue'

const Radio = withInstall(radio)
const RadioButton = withInstall(radioButton)
const RadioGroup = withInstall(radioGroup)

export default Radio
export { Radio, RadioButton, RadioGroup }
