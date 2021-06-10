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
    <k-pagination :hide-on-single-page="false" :total="1" :current-page="1"></k-pagination>
    <hr>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="1"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="2"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="3"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="4"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="5"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="6"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="7"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="71" :current-page="9"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="1"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="2"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="3"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="4"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="5"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="6"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="7"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="70" :current-page="8"></k-pagination>
    <hr>
    <k-pagination :hide-on-single-page="false" :total="710" :current-page="10"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="700" :current-page="10"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="810" :current-page="10" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="800" :current-page="10" :pager-count="8"></k-pagination>
    <hr>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="1" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="2" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="3" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="4" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="5" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="6" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="7" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="8" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="9" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="81" :current-page="10" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="1" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="2" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="3" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="4" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="5" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="6" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="7" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="8" :pager-count="8"></k-pagination>
    <k-pagination :hide-on-single-page="false" :total="80" :current-page="9" :pager-count="8"></k-pagination>
  </div>
</template>
<script>
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
})
</script>