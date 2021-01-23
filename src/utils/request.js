import axios from 'axios'

const service = axios.create({
  baseURL: import.meta.env.VITE_APP_BASE_API,
  timeout: 30000
})
service.defaults.headers.common.Accept = 'application/json';
// request interceptor
service.interceptors.request.use(
  (config) => {
    // do something before request is sent
    return config
  },
  error => {
    // do something with request error
    console.log(error) // for debug
    return Promise.reject(error)
  }
);

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
  */

  response => {
    const res = response.data;
    return res;
  },
  error => {
    console.log('err' + error); // for debug

    return Promise.reject(error);
  }
)

export default service
