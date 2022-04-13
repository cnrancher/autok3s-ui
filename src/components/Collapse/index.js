import { withInstall } from '@/components/util'
import collapse from './src/Collapse.vue'
import collapseItem from './src/CollapseItem.vue'

const Collapse = withInstall(collapse)
const CollapseItem = withInstall(collapseItem)

export { Collapse, CollapseItem }
