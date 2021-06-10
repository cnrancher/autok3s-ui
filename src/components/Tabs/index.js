import { withInstall } from '@/components/util'
import tabs from './src/index.vue'
import tabPane from './src/TabPane.vue'

const Tabs = withInstall(tabs)
const TabPane = withInstall(tabPane)

export { Tabs, TabPane }

