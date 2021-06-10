import { withInstall } from '@/components/util'
import dropdown from './src/index.vue'
import dropdownMenu from './src/DropdownMenu.vue'
import dropdownMenuItem from './src/DropdownMenuItem.vue'

const Dropdown = withInstall(dropdown)
const DropdownMenu = withInstall(dropdownMenu)
const DropdownMenuItem = withInstall(dropdownMenuItem)

export { Dropdown, DropdownMenu, DropdownMenuItem }
export default Dropdown