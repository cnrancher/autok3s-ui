import { defineStore } from 'pinia'
import { fetchList } from '@/api/sshKey.js'
import createApiStore from './createApiStore.js'

const useSshKeyStore = defineStore('sshKeyStore', createApiStore({ fetchList }))

export default useSshKeyStore
