import {assert} from './common.js'
import VNode from './vnode.js'
import {compileStringTemplate} from './expression.js'

export default class VText extends VNode{
  constructor(options,parent){
    assert(options)
    assert(options.el)
    assert(options.data)

    super(options.el,parent)

    //
    this._template = options.data

    this.status = 'init'

    this._last_str = undefined

  }
  render(){
    // console.log(this)
    let str = compileStringTemplate(
      this._template,
      this.$parent._proxy,
      this.$root.$options.filters
      )

    if(this._last_str !== str){
      this._el.data = str
      this.status = 'update'

      this._last_str = str

      // console.log('[vtext rendered]'+this.name)
    }
  }
}