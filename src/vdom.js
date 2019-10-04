import VElement from './velement.js'
import VText from './vtext.js'
// import VComponent from './vcomponent.js'

import {assert} from './common.js'


export function createVDom(node,parent,component){
  assert(node)
  assert(node._blue)
  assert(node.type == 'element' || node.type == 'text')

  // console.log(node)
  if(node.type == 'element'){

    if(node.ishtml){

      // VElement
      let ele = new VElement(node,parent)

      ele.$children = node.children.map(child=>{
        return createVDom(child,ele,component)
      })
      ele.$root = component

      return ele
    }else{
      // VComponent
      // let cmp = new VComponent(node,parent)

      // cmp.$children = node.children.map(child=>{
      //   createVDom(child,cmp,cmp)
      // })
      // cmp.$root = cmp 没用

      // return cmp
      // console.log(node)
      return node
    }

  }else{
    // VText
    let text = new VText(node,parent)
    text.$root = component
    return text
  }
}