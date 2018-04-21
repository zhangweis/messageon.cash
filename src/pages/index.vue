<template>
  <q-page class="flex flex-center">
    Redirecting...
  </q-page>
</template>

<style>
</style>

<script>
import keyStore from '../services/keystore';
export default {
  name: 'PageIndex',
  data(){
    return {
      messages: []
    }
  },
  mounted() {
    this.$router.push({ name: 'messages', params: { idOrName: keyStore.getAddress() }});
  },
  methods: {
  }
}
</script>
