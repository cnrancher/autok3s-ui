import { defineStore } from 'pinia'
import { fetchList } from '@/api/package.js'
import createApiStore from './createApiStore.js'

const usePackageStore = defineStore('packageStore', createApiStore({ fetchList }))

export default usePackageStore
