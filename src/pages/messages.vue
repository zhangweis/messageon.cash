<template>
  <q-page padding row items-start>
<q-toolbar color="secondary">
  <q-toolbar-title>
   Messages 
  </q-toolbar-title>
  <q-btn label="Refresh" @click="test"/>
  <q-btn label="Follow" @click="follow" v-if='!isSelf'/>
</q-toolbar>
<q-card>
  <compose/>
</q-card>
<q-card class="q-ma-sm" v-for='message of messages' :key="message.tx.txid">
    <q-item multiline>
      <q-item-side avatar="statics/boy-avatar.png">
      </q-item-side>
        <q-item-main>
          <q-item-tile label>
{{(names[message.tx.vin[0].addr]||{}).body||message.tx.vin[0].addr}}</q-item-tile>
          <q-item-tile sublabel lines="2">
 <a :href="'https://bch-insight.bitpay.com/#/tx/'+message.tx.txid">
    {{message.tx.time|datetime}}
</a>

</q-item-tile>
        </q-item-main>
    </q-item>
    <q-item>
      <q-card-title>
        {{message.body}}
      </q-card-title>
      </q-item>
      <q-card-actions align="around">
        <q-btn flat color="faded" icon="fa-thumbs-up" label="Like"/>
        <q-btn flat color="faded" icon="comment" label="Comment"></q-btn>
        <q-btn flat color="primary" icon="share" />
      </q-card-actions>
</q-card>
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
export default {
  name: 'PageMessages',
  components: {
    Compose
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
      isSelf: keystore.getAddress()==this.$route.params.idOrName
    }
  },
  async mounted() {
    this.test();
  },
  methods: {
		async test() {

    console.log(await messageStore.getFollowings(keystore.getAddress()));
    var address = this.$route.params.idOrName||keystore.getAddress();
      this.messages = await messageStore.getMessages(address);
      this.names = {};
      this.names[keystore.getAddress()] = await messageStore.getName(keystore.getAddress());
      if (address == keystore.getAddress()) {
        var followings = await messageStore.getFollowings(keystore.getAddress());
        for (var following of followings) {
          this.names[following] = await messageStore.getName(following);
          this.messages = this.messages.concat(await messageStore.getMessages(following));
        }
      }
      this.messages.sort((m1, m2)=>m2.tx.time-m1.tx.time);
      console.log(this.messages);
      
    },
    async follow() {
      console.log((await messageStore.follow(this.$route.params.idOrName)).toString());
    }
  }
}
</script>
<style>
</style>
