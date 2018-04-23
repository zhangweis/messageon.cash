<template>
        <router-link :to="{ name: 'messages', params: { idOrName: address}}">
{{(names[address]||{}).body||address}}
</router-link>

</template>
<script>
export default {
  props: {
    names: Object,
    address: String
  }
}
</script>
