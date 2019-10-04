import {assert} from './common.js'

export function parseDOM(dom){
  assert(dom)
  assert(dom instanceof Node)

  if(dom.nodeType == document.ELEMENT_NODE){
    // 1.type ——标签
    let tag = dom.tagName.toLowerCase();

    // 2.属性
    let attrs ={}
    Array.from(dom.attributes).forEach(attr=>{
      attrs[attr.name] = attr.value
    });

    // 3.children
    let children = []
    Array.from(dom.childNodes).forEach(child=>{
      children.push(parseDOM(child))
    })
    children = children.filter(child=>child !== undefined )

    let ishtml = dom.constructor !== HTMLUnknownElement && dom.constructor !== HTMLElement

    return{
      type:'element',
      tag,
      el:dom,
      attrs,
      children,
      ishtml,
      _blue:true
    }
  }else if(dom.nodeType == document.TEXT_NODE){
    let str = dom.data.trim()
    if(str){
      return{
        type:'text',
        el:dom,
        data:str,
        _blue:true
      }
    }else{
        return undefined;
      }
  }
}

export function parseDirectives(attrs){
  assert(attrs)
  assert(attrs.constructor == Object)

  let directives = []

  // v-
  // :      v-bind:xxxx
  // @      v-on:xxxx
  for(let key in attrs){

    let directive

    if(key.startsWith('v-')){   //v-if="xxx" v-show="xxxx" v-bind:xxx = "xxx" v-on:xxx

      let [name,arg] = key.split(':')
      directive = {name:name.replace(/^v\-/,''),arg}

    }else if(key.startsWith(':')){
      directive = {name:'bind',arg:key.substring(1)}
    }else if(key.startsWith('@')){
      directive = {name:'on',arg:key.substring(1)}
    }

    if(directive){

      // switch(directive.name){
      //   case 'bind':
      //     assert(directive.arg,'not defined what to bind')
      //     break;
      // }

      // 优化switch写法避免后期去除assert后产生冗余代码
      assert(directive.name == 'bind' && directive.arg || directive.name !='bind','not defined to bind '+ key)
      assert(directive.name == 'on' && directive.arg || directive.name !='on','event not defined '+ key)

      // v-model="a"
      // {name:'model',arg:undefined,value:attrs[key]}
      if(directive.name == 'model'){
        directives.push({
          name:'on',
          arg:'input',
          value:`${attrs[key]}=$event.target.value`,
          meta:{}
        })
        directives.push({
          name:'bind',
          arg:'value',
          value:attrs[key],
          meta:{}
        })
      }else{
        // 为每条指令准备独立的数据存储空间
        directive.meta = {}

        directive.value = attrs[key]
        directives.push(directive)
      }


        // console.log(directive)

    }

  }
  return directives
}

export function parseListener(directives){
  assert(directives)
  assert(directives instanceof Array)

  let Listener = directives.filter(directive=>directive.name == 'on')

  return Listener
}