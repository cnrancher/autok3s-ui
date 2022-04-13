module.exports = {
  env: {
    node: true,
    'vue/setup-compiler-macros': true
  },
  extends: ['eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
  rules: {
    // Enable vue/script-setup-uses-vars rule
    // 'vue/script-setup-uses-vars': 'error',
  }
}
