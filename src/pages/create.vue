<template>
  <q-page padding row items-start>
<q-toolbar color="secondary">
  <q-toolbar-title>
   Generate private key 
  </q-toolbar-title>
</q-toolbar>
  Key: <q-input type='text' :value='privateKey' :disable='true'/>
  <q-btn color="primary" label="OK" @click='useThis'/>
</q-page>
</template>
<script>
import keyStore from '../services/keystore';
export default {
  data() {
    return {
      privateKey: ''
    }
  },
  mounted() {
    this.privateKey = keyStore.generateKey().toWIF();
  },
  methods: {
    useThis() {
      keyStore.saveKey(this.privateKey);
      this.$router.push({ name: 'messages', params: { idOrName: keyStore.getAddress() }});
      setTimeout(()=>location.reload(), 3000);
    }
  }
}
</script>
