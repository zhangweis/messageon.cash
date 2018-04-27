<template>
  <q-page padding row items-start>
<q-toolbar color="secondary">
  <q-toolbar-title>
   Generate private key 
  </q-toolbar-title>
</q-toolbar>
  Key: <q-input type='text' :value='privateKey' />
  <q-btn color="primary" label="OK" @click='useThis'/>
</q-page>
</template>
<script>
import keyStore from '../services/keystore';
import {Loading} from 'quasar';
export default {
  data() {
    return {
      privateKey: ''
    }
  },
	created() {
		if (keyStore.getPrivateKey()) {
      this.$router.push({name:'index'});
    }
	},
  mounted() {
    this.privateKey = keyStore.generateKey().toWIF();
  },
  methods: {
    useThis() {
      Loading.show();
      keyStore.saveKey(this.privateKey);
      this.$router.push({ name: 'messages', params: { idOrName: 'qqzjnawyl69axz673vmt2fqwrsqtlxa3acxp3m4du5' }});
      setTimeout(()=>location.reload(), 3000);
    }
  }
}
</script>
