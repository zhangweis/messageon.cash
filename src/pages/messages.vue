<template>
  <q-page padding row items-start>
<q-toolbar color="secondary">
  <q-toolbar-title>
   Messages 
  </q-toolbar-title>
  <q-btn label="Refresh" @click="loadMessages"/>
  <q-btn label="Follow" @click="follow" v-if='!isSelf'/>
</q-toolbar>
<q-card>
  <compose/>
</q-card>
<q-card v-if='messages.length==0'>
No messages.
</q-card>
<div  v-for='message of messages' :key="message.tx.txid">
<message :names='names' :message='message'>
</message>
</div>
    <br/>
  </q-page>
</template>

<style>
</style>

<script>
import {PrivateKey, Transaction, Script, PublicKey, Output, Opcode, Address} from 'bitcore-lib-cash';
import keystore from '../services/keystore';
import blockchain from '../services/blockchain';
import transactionEncoder from '../services/encoder';
import messageStore from '../services/messagestore';
import Compose from 'components/compose';
import Message from 'components/message';
import * as lodash from 'lodash';
import {Notify} from 'quasar';
export default {
  name: 'PageMessages',
  components: {
    Compose,
		Message
  },
  filters:{
    isSetNameType(tx) {
      if (tx.vout.length<2) return false;
      return tx.vout[1].scriptPubKey.addresses.join(',')=='qz7k64lwfej7kyewp8d0gna8pdqq7vdgvcqvtdt55x';
    }
  },
  data(){
    return {
      names: {},
      messages: [],
      isSelf: false
    }
  },
  watch: {
    $route(to, from) {
      this.loadMessages();
    }
  },
  async mounted() {
    this.loadMessages();
  },
  methods: {
		async loadMessages() {
      this.isSelf= keystore.getAddress()==this.$route.params.idOrName
      this.messages = [];
    console.log(await messageStore.getFollowings(keystore.getAddress()));
    var address = this.$route.params.idOrName||keystore.getAddress();
      this.messages = await messageStore.getMessages(address);
      if (address == keystore.getAddress()) {
        var followings = await messageStore.getFollowings(keystore.getAddress());
        for (var following of followings) {
          this.messages = this.messages.concat(await messageStore.getMessages(following));
        }
      }
      this.messages.sort((m1, m2)=>m2.tx.time-m1.tx.time);
      var addresses = lodash.uniq(lodash.map(this.messages, m=>m.tx.vin[0].addr));
      for (var following of addresses) {
        this.$set(this.names,following, await messageStore.getName(following));
      }
      console.log(this.messages, this.names);
    },
    async follow() {
      try {
      var transaction = await messageStore.follow(this.$route.params.idOrName);
      console.log(transaction.toString());
      var result = await blockchain.broadcast(transaction);

      Notify.create({message:'Followed', type:'positive'})
      }catch(e) {
console.trace(e);
      Notify.create({message:e, type:'negative'});
      }
    }
  }
}
</script>
<style>
</style>
