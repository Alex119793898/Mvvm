import {assert} from './common.js'
import {expression} from './expression.js'
import VElement from './velement.js'



export default {
  // {name:"bind",arg:title,value:"a"}
  bind:{
    init(velement,directive){
      directive.meta._last_data = ''
    },
    update(velement,directive){
      assert(velement)
      assert(velement instanceof VElement)
      assert(directive)
      assert(directive.arg)
      assert(directive.value)

      let result = expression(directive.value,velement._proxy)

      if(directive.meta._last_data != result){
        velement._el.setAttribute(directive.arg,result)
        velement._el[directive.arg] = result

        directive.meta._last_data = result

      // console.log('[velement rendered]'+velement.name)

      }
    },
    destroy:null
  },
  // {name:"on",arg:"click",value:"a"}
  on:{
    init(velement,directive){
      velement._el.addEventListener(directive.arg,function(event){      //事件对象
        // 考虑情况：
        // value 'fn' ——> 'fn()'
        // value 'fn()' 'fn(a,b)'
        // value 'a+b'  'sum(a,b) + fn(9)'

        // console.log(velement._el,directive.arg,directive.value)

        let str = directive.value
        if(/^[\$_a-z][a-z0-9_\$]*$/i.test(str)){
          str+='($event)'
        }

        velement._set('$event',event)
        expression(str,velement._proxy)

      },false)
    },
    update:null,
    destroy:null
  },
  // {name:"mode",arg:undefined,value:"a"}
  // model:{
  //   init(velement,directive){

  //     velement.$directives.push({name:"bind",arg:"value",value:directive.value})
  //     velement.$directives.push({name:"on",arg:"input",value:`${directive.value} = $event.target.value`})

  //   },
  //   update:null,
  //   destroy:null
  // },

  // {name:"show",arg:undefined,value:"show"}
  // vue({el:'',data:{a:12,show:false}})
  show:{
    init:null,
    update(velement,directive){
      assert(velement)
      assert(velement instanceof VElement)
      assert(directive)
      assert(directive.value)

      let result = expression(directive.value,velement._data)

      if(result){
        velement._el.style.display = 'block'
      }else{
        velement._el.style.display = 'none'
      }
    },
    destroy:null
  },
  clock:{
    init:null,
    update(velement,directive){
      velement._el.removeAttribute('v-clock')
    },
    destroy:null
  },
  'if':{
    init(velement,directive){
      let holder = document.createComment('vue holder')

      velement.__parent = velement._el.parentNode

      velement.__holder = holder
      velement.__el = velement._el
    },
    update(velement,directive){
      let res = expression(directive.value,velement._data)
      console.log(res)

      if(res){
        if(velement.__holder.parentNode){
          velement.__parent.replaceChild(velement.__el,velement.__holder)
        }
      }else{
        velement.__parent.replaceChild(velement.__holder,velement.__el)

      }
    },
    destroy(velement,directive){}
  },
  'else-if':{
    init(velement,directive){},
    update(velement,directive){},
    destroy(velement,directive){}
  },
  'else':{
    init(velement,directive){},
    update(velement,directive){},
    destroy(velement,directive){}
  },
  'for':{
    init(velement,directive){
      // 在for指令init时候,把原来VElement的$directive中v-for删除
      // velement.$directives = velement.$directives.filter(item=>item!=directive)

      let template = directive.meta.template = velement;
      let parentNode = directive.meta.parent = velement._el.parentNode;

      let holder = directive.meta.holder = document.createComment('for holder')
      parentNode.replaceChild(holder,template._el)

      // 存
      directive.meta.elements = []

      // diff
      let last = []


      velement.render =function(){
        const template = directive.meta.template;
        const parentNode = directive.meta.parent;
        const holder = directive.meta.holder;
        let elements = directive.meta.elements;

        // diff方式优化,避免元素重复渲染
        // last / oldElements / dataResult / newElements
        let oldElements = [...elements]
        let newElements = []

        // 把parentNode中元素都remove
        elements.forEach(element=>{
          parentNode.removeChild(element._el)
        })
        elements.length = 0;

        let {keyName,valueName,data} = parseFor(directive.value)
        let dataResult = expression(data,velement._proxy)


        dataResult.forEach((item,index)=>{
          let n = last.indexOf(item)

          if(n!=-1){
            // console.log(index,'找到原始element')
            newElements[index] = oldElements[n];

            // 必须要在last中splice删除对应项,比如arr[0]++ 如果不删 n= 1,2 但是oldElements删了 n=2时 oldElements[2] = undefined 虽然影响不大 后期在oldElements.length>0中可以弥补,但是不太好
            last.splice(n,1)
            // console.log(last)

            oldElements.splice(n,1)
            // console.log(oldElements)

          }else{
            // console.log(index,'发现新数据')
            newElements[index] = null
          }
        })

        newElements.forEach((item,index)=>{
          if(item) return

          if(oldElements.length>0){
            // console.log(index,'拿已有备用元素')
            newElements[index] = oldElements.pop()
          }else{
            // console.log(index,'全新数据')
            newElements[index] = template.clone()

            //给clone出来的元素初始化指令
            newElements[index].init()
          }
        })

        // 上一次的last数据使用完以后,用新的dataResult赋值last
        last = [...dataResult]


        let fragment = document.createDocumentFragment()
        newElements.forEach((element,i)=>{
          keyName && element._set(keyName,i)
          element._set(valueName,dataResult[i])

          //
          fragment.appendChild(element._el)
        })
        parentNode.insertBefore(fragment,holder)

        // for(let i in dataResult){
        //   let Vel = template.clone()
        //   elements.push(Vel)

        //   // keyName && (Vel._data[keyName] = i)
        //   // Vel._data[valueName] = dataResult[i]
        //   keyName && Vel._set(keyName,i)
        //   Vel._set(valueName,dataResult[i])

        //   parentNode.insertBefore(Vel._el,holder)
        // }

        newElements.forEach(vel=>{
          vel.render()
        })
        directive.meta.elements = newElements
      }
    },
    update(velement,directive){},
    destroy(velement,directive){}
  },
  // {name:"html",arg:undefined,value:"show"}
  // vue({el:'',data:{a:12,show:false,html:'<strong>加粗加粗</strong>'}})
  html:{
    init:null,
    update(velement,directive){
      assert(velement)
      assert(velement instanceof VElement)
      assert(directive)
      assert(directive.value)

      let result = expression(directive.value,velement._data)
      velement._el.innerHTML = result
    },
    destroy:null
  },
  text:{
    init:null,
    update(velement,directive){
      assert(velement)
      assert(velement instanceof VElement)
      assert(directive)
      assert(directive.value)

      let result = expression(directive.value,velement._data)
      let text = document.createTextNode(result)
      velement._el.innerHTML = ''
      velement._el.append(text)
    },
    destroy:null
  }
}


function parseFor(str){
  // str=> 'xxx in xxx'
  // str=> 'xx,xx in xxx'
  let [strName,data]= str.split(' in ')
  let [valueName,keyName] = strName.split(',')

  return {keyName,valueName,data}
}