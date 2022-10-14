import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/credentials',
    method: 'get'
  })
}

export function createCredential(data) {
  return request({
    url: '/credentials',
    method: 'post',
    data
  })
}

export function updateCredential(id, data) {
  return request({
    url: `/credentials/${id}`,
    method: 'put',
    data
  })
}

export function fetchById(id) {
  return request({
    url: `/credentials/${id}`,
    method: 'get'
  })
}

export function remove(id) {
  return request({
    url: `/credentials/${id}`,
    method: 'delete'
  })
}
