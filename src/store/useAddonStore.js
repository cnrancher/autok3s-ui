import { defineStore } from 'pinia'
import { fetchList } from '@/api/addon.js'
import createApiStore from './createApiStore.js'

const useSshKeyStore = defineStore('addOnStore', createApiStore({ fetchList }))

export default useSshKeyStore
