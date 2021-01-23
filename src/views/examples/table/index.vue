<template>
  <div>
    <k-table
    :data="data"
    groupBy="name"
    >
      <k-table-column
        type="selection"
      >
    </k-table-column>
    <k-table-column
      label="Name"
      field="name"
      :sortable="true"
    >
    </k-table-column>
    <k-table-column
      label="Desc"
      field="desc"
    >
    <template #default="{row, column}">custom column: {{row[column.field]}}</template>
    </k-table-column>
    </k-table>
    <hr>
    <k-table
    :data="data"
    >
      <k-table-column
        type="selection"
      >
    </k-table-column>
    <k-table-column
      label="Name"
      field="name"
      :sortable="true"
    >
    </k-table-column>
    <k-table-column
      label="Desc"
      field="desc"
    >
    <template #default="{row, column}">custom column: {{row[column.field]}}</template>
    </k-table-column>
    </k-table>
    <hr>
    <pagination :hide-on-single-page="false" :total="1" :current-page="1"></pagination>
    <hr>
    <pagination :hide-on-single-page="false" :total="71" :current-page="1"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="2"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="3"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="4"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="5"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="6"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="7"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="8"></pagination>
    <pagination :hide-on-single-page="false" :total="71" :current-page="9"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="1"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="2"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="3"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="4"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="5"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="6"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="7"></pagination>
    <pagination :hide-on-single-page="false" :total="70" :current-page="8"></pagination>
    <hr>
    <pagination :hide-on-single-page="false" :total="710" :current-page="10"></pagination>
    <pagination :hide-on-single-page="false" :total="700" :current-page="10"></pagination>
    <pagination :hide-on-single-page="false" :total="810" :current-page="10" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="800" :current-page="10" :pager-count="8"></pagination>
    <hr>
    <pagination :hide-on-single-page="false" :total="81" :current-page="1" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="2" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="3" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="4" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="5" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="6" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="7" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="8" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="9" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="81" :current-page="10" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="1" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="2" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="3" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="4" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="5" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="6" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="7" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="8" :pager-count="8"></pagination>
    <pagination :hide-on-single-page="false" :total="80" :current-page="9" :pager-count="8"></pagination>
  </div>
</template>
<script>
import { Table as KTable, TableColumn as KTableColumn } from '@/components/Table'
import Pagination from '@/components/Pagination'
import {ref, defineComponent} from 'vue'
export default defineComponent({
  setup() {
    const data = ref([])
    data.value = [{
      id: 1,
      name: 'name1',
      desc: 'desc1',
      group: 'test',
    },
    {
      id: 2,
      name: 'name2',
      desc: 'desc2',
      group: 'test'
    }]
    const onOrderChange = (e) => {
      console.log(e)
    }
    return {
      data,
    }
  },
  components: {
    KTable,
    KTableColumn,
    Pagination
  }
})
</script>