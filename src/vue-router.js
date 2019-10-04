import Vue from './vue.js'
import {assert} from './common.js'


export default class Router{
  constructor(options){
    assert(options)
    assert(options.routes)
    assert(options.routes instanceof Array)

    this.routes = [...options.routes]
    this._vue = null

  }
  init(){
    this._el = document.getElementById('router-view')

    window.addEventListener('hashchange',()=>{
      this.parse()
    },false)

    this.parse()

  }

  parse(){
    let hash = location.hash.substring(1)
    let route

    if(hash){
      route = this.routes.find(route=>route.path == hash)
      assert(route,`path "${hash}" is not defined`)
      assert(route.component,`component is require`)


      let cmp = document.createElement(route.component)
      this._el.parentNode.replaceChild(cmp,this._el)
      // console.log(this._vue)

      //
      let vdom = this._vue.createComponent(cmp,this._vue)
      this._el = vdom.root._el
    }
    this._vue._data.$route = route || {}
  }
}

Vue.component('routerlink',{
  props:['to'],
  template:`
    <a :href="'#'+to">
      <slot></slot>
    </a>
  `
})
Vue.component('router-view',{
  template:`
    <div id='router-view'>123456</div>
  `
})

