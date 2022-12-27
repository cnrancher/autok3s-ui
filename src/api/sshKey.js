import request from '@/utils/request'

export function fetchList() {
  return request({
    url: '/sshKeys',
    method: 'get'
  })
}

export function fetchById(id) {
  return request({
    url: `/sshKeys/${id}`,
    method: 'get'
  })
}

export function remove(id) {
  return request({
    url: `/sshKeys/${id}`,
    method: 'delete'
  })
}

export function create(data) {
  return request({
    url: '/sshKeys',
    method: 'post',
    data
  })
}

export function exportSshKey(id) {
  return request({
    url: `/sshKeys/${id}?action=export`,
    method: 'post'
  })
}
