import {assert} from './common.js'
import eventQueue from './event.js'
let uuid = require('uuid/v4')


export default class VNode extends eventQueue{
  constructor(el,parent){
    super()

    assert(el)
    assert(el instanceof Node)


    this.status = '';

    this._el = el;
    this.$parent = parent;

    this.name = uuid()
  }


  render(){
    throw new Error('render is not defined')
  }
}