import {Notify} from 'quasar';
export default async function(func) {
    try {
      await func();
      Notify.create({
        message:'Sent to blockchain',
        type:'positive'
      });
    } catch (e) {
console.trace(e)
      Notify.create({message:e,
        type: 'negative',
      });
    }
 }
