import Vue from './vue.js'
import {Store} from './store.js'
import Router from './vue-router.js'



Vue.component('cmp1',{
  template:`
  <div>
    <button @click="$emit('abc',12,5)">事件队列</button>
  </div>
  `
})

window.vm = new Vue({
  el:'#root',
  data:{
    a:12,
  },
  watch:{},
  mounted(){
    this.$refs.ccc.$on('abc',(a,b)=>{
      console.log('aaaaaaaaaaaa',a,b)
    })
  },
  // router
})



// console.log(vm)