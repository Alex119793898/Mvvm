
import {assert} from './common.js'

export class Store{
  constructor(options){
    assert(options)
    assert(options.state)

    this.state = options.state
    this._moutations = options.moutations || {}
    this._actions = options.actions || {}

    this._vue = null
  }
  commit(name,...args){
    let moutation = this._moutations[name]
    assert(moutation,`moutation "${name}" is not defined`)

    // this.a
    moutation(this.state,...args)
    // this.a

    // 通知vue数据更新渲染
    console.log('force update')
    assert(this._vue,'Store must in vue options')
    this._vue.forceUpdate()

  }
  async dispatch(name,...args){
    let action = this._actions[name]
    assert(action,`action ${name} is not defined`)

    await action(this,...args)
  }
}