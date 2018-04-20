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
          <div slot="subtitle">{{address}}</div>
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
        <q-list-header>Essential Links</q-list-header>
        <q-item>
        <router-link :to="{ name: 'messages', params: { idOrName: address}}">Messages</router-link>
        </q-item>
        <q-item>
        <router-link :to="{ name: 'index'}">Home</router-link>
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

export default {
  name: 'LayoutDefault',
  data () {
    return {
      leftDrawerOpen: this.$q.platform.is.desktop,
      address: ''
    }
  },
    mounted() {
      this.address = keyStore.getAddress();
console.log(this.address);
    },
   methods: {
    openURL,
    async setName() {
      var name = prompt('Name');
      if (!name) return;
      var transaction = await messageStore.setName(name);
      console.log(transaction.toString());
    },
    async getName() {
      console.log(await messageStore.getName(keyStore.getAddress()));
    }
 }
}
</script>

<style>
</style>
