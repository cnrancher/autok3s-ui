<template>
  <div class="flex justify-center">
    <div class="max-w-450px">
      <svg xmlns="http://www.w3.org/2000/svg" width="90" height="90" fill="#DBE1EC" viewBox="0 0 48 48">
        <path
          d="M22 30h4v4h-4zm0-16h4v12h-4zm1.99-10C12.94 4 4 12.95 4 24s8.94 20 19.99 20S44 35.05 44 24 35.04 4 23.99 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16z"
        />
      </svg>

      <div class="text-gray-500 text-size-1.5rem mt-15px mb-8px">
        Please check that the URL you entered is correct, or click the button below to return to the homepage.
      </div>

      <p class="text-gray-400 leading-5 mb-10px">
        <router-link class="text-light-blue-500" to="/">Back to Home</router-link>
      </p>
    </div>
  </div>
</template>
