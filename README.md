# AutoK3s UI

## Browser Support

1. For development: [native ESM dynamic import support](https://caniuse.com/es6-module-dynamic-import) is required.
2. For production: the default build targets browsers that support [native ESM via script tags](https://caniuse.com/es6-module).

## Project setup
```shell
npm install
```

### Compiles and hot-reloads for development
1. Download [Autok3s CLI](https://github.com/cnrancher/autok3s/releases) binary file, and run.

```shell
chmod +x ./autok3s

./autok3s -d serve
```

2. Start dev server

```shell
npm run dev
```

### Compiles and minifies for production
```
npm run build
```

### Customize configuration
See [Configuration Reference](https://vitejs.dev/config/).
