
import {assert} from './common.js'

export function createProxy(data,staticData,cb,path=[]){

  assert(data,'data is required')
  assert(cb,'cb is required')
  assert(typeof cb == 'function' , 'cb must is function')

  let res
  if(data instanceof Array){
    res = []

    for(let i=0;i<data.length; i++){
      if(typeof data[i] == 'object'){
        res[i] = createProxy(data[i],staticData,cb,[...path,i])
      }else{
        res[i] = data[i]
      }
    }
  }else{
    res = {}

    for(let key in data){
      // json的key不能是$符号开头
      assert(!key.startsWith('$'),'data key must not be $')

      if(typeof data[key] == 'object'){
        res[key] = createProxy(data[key],staticData,cb,[...path,key])
      }else{
        res[key] = data[key]
      }
    }

  }


  return new Proxy(res,{
    get(data,name){
      // assert(data[name]!==undefined,`${name} is not defined`);

      if(staticData[name]){
        return staticData[name]
      }else{
        return data[name]
      }

    },
    set(data,name,val){

      // 处理如果proxy监听的数据 被赋值[] {} 就对该[] {}createProxy监听
      if(typeof val == 'object'){
        // console.log(val)
        data[name] = createProxy(val,staticData,cb)
      }else{
        data[name] = val
      }

      cb([...path,name])
      return true
    }
  })


}