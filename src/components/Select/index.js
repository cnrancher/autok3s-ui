import { withInstall } from '@/components/util'
import select from './src/index.vue'
import option from './src/Option.vue'

const Select = withInstall(select)
const Option = withInstall(option)

export {Select, Option}
export default Select
