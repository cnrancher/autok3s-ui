import request from '@/utils/request'
import { downloadRequest } from '@/utils/request'

export function fetchList() {
  return request({
    url: '/packages',
    method: 'get'
  })
}

export function remove(id) {
  return request({
    url: `/packages/${id}`,
    method: 'delete'
  })
}

export function update(id, data) {
  return request({
    url: `/packages/${id}`,
    method: 'put',
    data
  })
}

export function exportPackage(id) {
  return downloadRequest({
    url: `/packages/${id}?link=export`,
    method: 'get',
    responseType: 'blob',
    headers: {
      'Content-Type': 'application/gzip'
    }
  })
}

export function fetchById(id) {
  return request({
    url: `/packages/${id}`,
    method: 'get'
  })
}

export function create(data) {
  return request({
    url: '/packages',
    method: 'post',
    data
  })
}

export function fetchInstallScript() {
  return request({
    url: `/settings/install-script`,
    method: 'get'
  })
}

export function updateInstallScript() {
  return request({
    url: `/packages?action=update-install-script`,
    method: 'post'
  })
}

export function createPackage(data) {
  return request({
    url: `/packages`,
    method: 'post',
    data
  })
}

export function importPackage(name, data) {
  return request({
    url: `/packages?action=import&name=${name}`,
    method: 'post',
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    data
  })
}

export function fetchPackageSouce(signal) {
  return request({
    url: `/settings/package-download-source`,
    method: 'get',
    signal
  })
}

export function updatePackageSource(data, signal) {
  return request({
    url: `/settings/package-download-source`,
    method: 'put',
    data,
    signal
  })
}

export function cancelDownloadPkg(name, signal) {
  return request({
    url: `/packages/${name}?action=cancel`,
    method: 'post',
    signal
  })
}

export function downloadPkg(name, signal) {
  return request({
    url: `/packages/${name}?action=download`,
    method: 'post',
    signal
  })
}
