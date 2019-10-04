import {assert,dom} from './common.js'
import {parseDOM} from './parser.js'
import {createVDom} from './vdom.js'
import {createProxy} from './proxy.js'
import directives from './directives.js'
import VElement from './velement.js'
import {Store} from './store.js'
import eventQueue from './event.js'

export default class Vue extends eventQueue{
  constructor(options){
    super()

    this.$options = options

    this.$refs = {}
    this.components = options.components || {}

    // vuex的store 与 vue连接完成
    if(options.store){
      assert(options.store instanceof Store)
      // store连接到模版 指令中就可以使用this.$store
      this.$store = options.store
      options.store._vue = options.store._vue||this
    }

    //创建velement / vtext / vcomponent其中之一
    let el = dom(options.el)
    let vdomTree = this.createComponent(el,this)
    this.root = vdomTree;

    // 从options接收生命周期函数
    this.created = options.created;
    this.updated = options.updated;
    this.mounted = options.mounted

    // 汇总指令
    this._directives = {
        ...directives,
        ...options.directives
    }

    this._staticData = {
        ...options.methods,
        // store连接到模版 可以使用{{$store.state.a}}
        $store:options.store,
        $emit:this.$emit.bind(this),
        $on:this.$on.bind(this),
        $refs:this.$refs
    }

    // 实现watch
    this._watchs = options.watch || {}
    this.__watch_list = []

    // proxy监听数据
    this._data =createProxy(options.data||{},this._staticData,path=>{

      for(let i=0;i<path.length;i++){
        // console.log(path)
        let str = path.slice(0,i+1).join('.')
        // console.log(str)
        let watch= this._watchs[str]

        // 避免watch重复渲染
        if(watch){
          this.__watch_list.push(watch)
        }
      }
      // computed执行
      this._doComputed()

      // 优化版的render执行
      this.forceUpdate()
    })

    // 把this传给vue-router
    if(options.router){
      let router = options.router

      router._vue = this
      router.init()

      this.$router = router
    }


    // 初始化执行computed
    this._doComputed()

    // 初始化所有的element的directive
    this.root.init()

    // 初始渲染
    this.render()

    this.status = 'init'
    this.created && this.created.call(this._data)

    //优化渲染准备定时器变量
    this._render_timer = 0

    // mounted阶段
    this.mounted && this.mounted.call(this._data)

    // return this._data
  }

  // computed实现
  _doComputed(){
    for(let key in this.$options.computed){
      let fn = this.$options.computed[key]

      this._staticData[key] = fn.call(this._data)

      console.log(fn.call(this._data))
    }
  }

  // 优化渲染
  forceUpdate(){
    clearTimeout(this._render_timer)
    this._render_timer = setTimeout(()=>{
      this.render()
    },0)
  }

  render(){
    // 渲染自己
    this.root.render()
    // 执行完自身渲染,执行watch
    this.__watch_list.forEach(fn=>{
      fn.call(this._data)
    })
    this.__watch_list.length = 0


    this.status = 'update'
    this.updated && this.updated.call(this._data)

    // console.log('root render')
  }

  // 核心处理组件功能
    // 1.<component></component>
    // 2.自定义普通组件<cmp></cmp>
  createComponent(el,vue){
    let domTree = parseDOM(el)

    // 找带有ref属性的domTree
    function findRef(node){
      if(!node.attrs)return

      // 查找ref属性
      if(node.attrs.ref){
        // 方便218行判断
        node.ref = node.attrs.ref
      }
      node.children.forEach(child=>findRef(child))
    }
    findRef(domTree)

    let vdomTree = createVDom(domTree,this,this);
    // findAndCreateComponent方法:发现并创建组件
      // 1.if:在node参数的node._blue属性找到需要创建component的信息
      // 2.else:其余的node都是velement或者vtext
      // 3.else里递归处理了velement的$children存在node._blue属性的json并递归调用if里的内容
    let findAndCreateComponent=(node)=>{

      if(node._blue){
        //
        let component;
        // 区别普通组件和<component></component>
        if(node.tag!='component'){
          //
          component = vue.components[node.tag] || components[node.tag]
          assert(component,`no "${node.tag}" component found`)
        }else{
          //
          assert(node.attrs.is,'no "is" attrubute')
          component = vue.components[node.attrs.is] || components[node.attrs.is]
          assert(component,`no "${node.tag}" component found`)
        }

        assert(component.template!==undefined,`"${node.tag}" component no template attribute`)

        //新建div容器(template)放置"component.template的内容"
        let oDiv = document.createElement('div')
        oDiv.innerHTML = component.template
        assert(oDiv.children.length == 1,`component template must have one element`)

        // slots
        let slots = oDiv.getElementsByTagName('slot')
        // console.log(node)

        Array.from(slots).forEach(slot=>{
          let fragment = document.createDocumentFragment()

          node.children.forEach(child=>{
            fragment.appendChild(child.el.cloneNode(true))
          })

          slot.parentNode.replaceChild(fragment,slot)
        })

        //
        let root = oDiv.children[0]
        node.el.parentNode.replaceChild(root,node.el)

        // 调用Vue构造组件
        let cmp = new Vue({
          el:root,
          ...component,
          store:vue.store
        })
        cmp.$root = cmp
        // console.log(cmp)

        // 给具有ref属性的组件的$refs属性添加属性值
        if(node.ref){
          vue.$refs[node.ref]=cmp
        }

        // props组件传值
        component.props && component.props.forEach(name=>{
          cmp._data[name] = node.attrs[name]
        })

        return cmp
      }else{
        if(node instanceof VElement){
          for(let i=0; i<node.$children.length;i++){
            node.$children[i] = findAndCreateComponent(node.$children[i])
            // console.log(node.$children[i] )
            // break
          }
        }
        return node
      }
    }
    vdomTree = findAndCreateComponent(vdomTree,this)

    return vdomTree
  }

}

let components = {}
Vue.component = function(name,options){
  components[name] = options
}

