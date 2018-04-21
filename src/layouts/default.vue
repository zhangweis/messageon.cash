<template>
  <q-layout view="lHh Lpr lFf">
    <q-layout-header>
      <q-toolbar
        color="primary"
        :glossy="$q.theme === 'mat'"
        :inverted="$q.theme === 'ios'"
      >
        <q-toolbar-title>
          MessageOn Bitcoin Cash
          <div slot="subtitle">
</div>
        </q-toolbar-title>
        <q-btn
          flat
          dense
          round
          @click="leftDrawerOpen = !leftDrawerOpen"
          aria-label="Menu"
        >
          <q-icon name="menu" />
        </q-btn>

      </q-toolbar>
    </q-layout-header>

    <q-layout-drawer
side="right"
      v-model="leftDrawerOpen"
      :content-class="$q.theme === 'mat' ? 'bg-grey-2' : null"
    >
      <q-list
        no-border
        link
        inset-delimiter
      >
        <q-list-header>Menu</q-list-header>
<q-collapsible
        v-model='opened'
        icon="perm_identity"
      >
<q-alert type='warning' class="q-mb-sm" v-if='addressObj&&addressObj.balance<=0'>
  Balance needed to do operations like post message, set name,...etc. Normally 0.001 BCH is enough.
</q-alert>
        <div><v-qrcode :value='address'/></div>
<q-item>
Balance: {{addressObj.balance}}
</q-item>
<a target="_blank" style="word-wrap: break-word;" :href="'https://explorer.bitcoin.com/bch/address/'+address">{{address}}</a>
      </q-collapsible>

        <q-item>
        <router-link :to="{ name: 'messages', params: { idOrName: address}}">Messages</router-link>
        </q-item>
        <q-item>
        <router-link :to="{ name: 'messages', params: { idOrName: 'qqzjnawyl69axz673vmt2fqwrsqtlxa3acxp3m4du5'}}">Developer</router-link>
        </q-item>
        <q-item>
        <a @click='setName'>Set Name</a>
        </q-item>
        <q-item>
        <a @click='getName'>Get Name</a>
        </q-item>
      </ul>
      </q-list>
    </q-layout-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script>
import { openURL } from 'quasar'
import keyStore from '../services/keystore'
import messageStore from '../services/messagestore'
import blockchain from '../services/blockchain'
import VQrcode from 'v-qrcode'
import {Notify} from 'quasar'
export default {
  name: 'LayoutDefault',
  components:{
    VQrcode
  },
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      address: '',
      opened: false,
      addressObj: {}
    }
  },
    async mounted() {
      if (!keyStore.getPrivateKey()) {
        this.$router.push({name:'create'});
      }
      this.address = keyStore.getAddress();
      this.addressObj = (await blockchain.getAddress(this.address));
      this.opened = this.addressObj.balance<=0;
    },
   methods: {
    openURL,
    async setName() {
      try {
      var name = prompt('Name');
      if (!name) return;
      var transaction = await messageStore.setName(name);
      console.log(transaction.toString());
      var result = await blockchain.broadcast(transaction);
      Notify.create({
        message:'Sent to blockchain',
        type:'positive'
      });
    } catch (e) {
      Notify.create({message:e,
        type: 'negative',
      });
    }
    },
    async getName() {
      console.log(await messageStore.getName(keyStore.getAddress()));
    }
 }
}
</script>

<style>
</style>
