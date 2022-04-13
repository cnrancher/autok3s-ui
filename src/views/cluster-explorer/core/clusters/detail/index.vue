<template>
  <k-loading :loading="loading">
    <page-header>
      <template #title>
        <router-link :to="{ name: 'ClusterExplorerCoreClusters' }">Cluster:</router-link>
        {{ clusterNodes?.name }}
        <cluster-state-tag :status="clusterNodes?.status ?? 'unknown'"></cluster-state-tag>
      </template>
      <template #subtitle>Provider: {{ clusterNodes?.provider }}</template>
    </page-header>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-10px">
      <k-input label="Master" readonly :model-value="clusterNodes.master"></k-input>
      <k-input label="Worker" readonly :model-value="clusterNodes.worker"></k-input>
      <k-input
        v-if="!['k3d', 'native'].includes(clusterNodes?.provider)"
        label="Region"
        readonly
        :model-value="clusterNodes.region"
      ></k-input>
      <k-input
        v-if="!['k3d', 'native'].includes(clusterNodes?.provider)"
        label="Zone"
        readonly
        :model-value="clusterNodes.zone"
      ></k-input>
      <k-input label="Version" readonly :model-value="clusterNodes.version"></k-input>
    </div>
    <hr class="section-divider" />
    <div class="cluster-node__table-header">
      <h3 class="text-size-18px">Nodes</h3>
      <input
        v-model="searchQuery"
        type="search"
        placeholder="Filter(State, Node Status, Version, Roles)"
        class="h-10 focus-visible:outline-none px-12px rounded border hover:bg-gray-100"
      />
    </div>
    <k-table :data="nodes" :state="state">
      <k-table-column sortable label="State" field="instance-status">
        <template #default="{ row, column }">
          <cluster-state-tag :status="row[column.field]"></cluster-state-tag>
        </template>
      </k-table-column>
      <k-table-column sortable label="Node Status" field="status">
        <template #default="{ row, column }">
          <cluster-state-tag :status="row[column.field]"></cluster-state-tag>
        </template>
      </k-table-column>
      <k-table-column v-if="clusterNodes?.provider !== 'k3d'" sortable label="Region" field="region">
        {{ clusterNodes.region }}
      </k-table-column>
      <k-table-column sortable label="Roles" field="roles">
        <template #default="{ row, column }">
          {{ row[column.field] ?? '' }}
        </template>
      </k-table-column>
      <k-table-column sortable label="Version" field="version"></k-table-column>
      <k-table-column sortable label="instance ID" field="instance-id"></k-table-column>
      <k-table-column v-if="clusterNodes?.provider !== 'k3d'" label="Public IP" field="external-ip">
        <template #default="{ row, column }">
          {{ row[column.field]?.join(', ') }}
        </template>
      </k-table-column>
      <k-table-column v-if="clusterNodes?.provider !== 'k3d'" label="Internal IP" field="internal-ip">
        <template #default="{ row, column }">
          {{ row[column.field]?.join(', ') }}
        </template>
      </k-table-column>
      <k-table-column type="action" field="action" width="30">
        <template #default="{ row }">
          <node-actions :node="row" :cluster="clusterNodes" @exec-command="handleCommand"></node-actions>
        </template>
      </k-table-column>
      <template #error>
        <div class="cluster-table__error">
          <div>Load nodes failed: {{ error }}</div>
          <div>
            Please click
            <button class="btn btn-sm role-secondary" @click="reload">refresh</button>
            button to reload nodes data
          </div>
        </div>
      </template>
    </k-table>
  </k-loading>
</template>
<script setup>
import { computed, toRef } from 'vue'
import useDataSearch from '@/composables/useDataSearch.js'
import useTableState from '@/composables/useTableState.js'
import useNodes from '@/composables/useNodes.js'
import PageHeader from '@/views/components/PageHeader.vue'
import ClusterStateTag from '../components/ClusterStateTag.vue'
import NodeActions from './components/NodeActions.vue'
import useWindownManagerStore from '@/store/useWindowManagerStore.js'

const props = defineProps({
  clusterId: {
    type: String,
    required: true
  }
})

const wmStore = useWindownManagerStore()
const clusterId = toRef(props, 'clusterId')
const { clusterNodes, error, loading, fetchClusterNodes } = useNodes(clusterId)
const rawNodes = computed(() => {
  return clusterNodes.value.nodes ?? []
})
const { searchQuery, searchFields, dataMatchingSearchQuery: nodes } = useDataSearch(rawNodes)
searchFields.value = ['instance-status', 'status', 'version', 'roles']
const { state } = useTableState(loading, error, rawNodes, nodes)

const reload = () => {
  fetchClusterNodes()
}
const handleCommand = ({ command, node, cluster }) => {
  switch (command) {
    case 'exec-shell':
      wmStore.addTab({
        id: `node-shell_${node['instance-id']}`,
        component: 'NodeShell',
        label: `shell: ${node['external-ip']?.[0] ?? node['instance-id']}`,
        icon: 'terminal',
        attrs: {
          clusterId: cluster.id,
          nodeId: `${node['instance-id']}`,
          provider: cluster.provider
        }
      })
      break
  }
}
</script>
<style>
.cluster-node__table-header {
  display: grid;
  grid-template-areas: 'title search';
  grid-template-columns: 1fr minmax(min-content, 300px);
  align-items: center;
  padding: 0 0 10px 0;
  & > h3 {
    grid-area: title;
  }
  & > input {
    grid-area: search;
  }
}
</style>
