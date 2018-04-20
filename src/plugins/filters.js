// import something here
import * as moment from 'moment'
// leave the export, even if you don't use it
export default ({ app, router, Vue }) => {
  // something to do
  Vue.filter('datetime', function(datetime) {
    return moment(datetime*1000).format('MM-DD HH:mm');
  });
}
