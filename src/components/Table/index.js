import { withInstall } from '@/components/util'
import baseTable from './src/BaseTable.vue'
import table from './src/index.vue'
import tableColumn from './src/TableColumn.vue'

const BaseTable = withInstall(baseTable)
const Table = withInstall(table)
const TableColumn = withInstall(tableColumn)

export { BaseTable, TableColumn, Table }
export default Table
