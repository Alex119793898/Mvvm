import {assert} from './common.js'
import VNode from './vnode.js'
import {parseDirectives,parseListener} from './parser.js'
import directives from './directives.js'
import {parseDOM} from './parser.js'
import {createVDom} from './vdom.js'
import {createProxy} from './proxy.js'

export default class VElement extends VNode{
  constructor(options,parent){

    assert(options)
    assert(options.el)
    assert(options.tag)
    assert(options.attrs)
    assert(options.children)

    super(options.el,parent)
    //
    this.type = options.tag

    this.$attrs = options.attrs
    this.$directives = parseDirectives(options.attrs)
    this.$listeners = parseListener(this.$directives)

    // 这个在vue里去执行了,在这执行this.$root还未定义报错_directives of undefined
    // 在vue.js中控制指令执行解决这个问题
    // this._directive('init')
    // this.status = 'init'

    // 存好的options,在clone()方法里有用
    this.$options = options

    // 给velement自己的数据(v-for产生的item index) 和 component传进来的参数添加proxy监听
    // 这样directive.js文件中的data全都在 velement的this._data找数据了
    // this._data = createProxy({},component._data,()=>{
    //   this.render()
    // })

    this._data = {}

    let _this = this
    this._proxy = new Proxy(this._data,{
      get(data,name){
        return _this._get(name)
      },
      set(data,name,val){
        // ?
        // data[name]=val

        // 这个才是合理的
        _this.$root._data[name] =val
        return true
      }
    })
  }
  //
  _get(name){
    let current = this

    while(current){
      // console.log(current._data)
      if(current._data[name]!==undefined){
        return current._data[name]
      }

      current = current.$parent
    }
    return undefined
  }
  //
  _set(name,val){
    this._data[name] = val
  }

  render(){
    // 只渲染指令
    this._directive('update')

    // 剩余让子元素渲染
    this.$children.forEach(child=>child.render())

    this.status = 'update'

    // console.log('[velement rendered]'+this.name)
  }

  _directive(type){
    // 优先执行v-model
    doDirectives.call(this,this.$directives)

    function doDirectives(arr){
      arr.forEach(directive=>{

        let directiveObj = this.$root._directives[directive.name];
        assert(directiveObj,'no directive'+directive.name)

        let dirFn = directiveObj[type];

        if(dirFn){
          assert(typeof dirFn == 'function');
          dirFn(this,directive);
        }

      })
    }
  }

  clone(){
    let element = parseDOM(this._el.cloneNode(true))
    delete element.attrs['v-for']

    let tree = createVDom(element,this.$parent,this.$root)

    return tree
  }
  init(){
      //
      this._directive('init')
      this.status = 'init'

      if(this.$children){
        this.$children.forEach(child=>{
          if(child instanceof VElement){
            child.init()
          }
        })
      }
    }



}