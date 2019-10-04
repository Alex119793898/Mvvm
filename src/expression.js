import {assert} from './common.js'

// 准备js内置 关键字
const keyword={
  'new':true,
  'class':true,
  'for':true
}


export function expression(str,data,filters){
  // filters实现1.1
  let strArr = str.split('|')
  str = strArr[0]


  // 如果表达式中使用了Math.max,parseInt()类似的系统函数或者 js内置关键字 的处理方法
  function parseGlobal(s,localExpr){
    if(s in window || keyword[s] && !data[s]){
      return s
    }else{
      return localExpr
    }
  }

  // 思路1...
  // 思路2...
  // 思路3:解决思路1,2:写了parseExpr函数,解决思路2 带有''出现字符串引号的情况
  let arr = parseExpr(str)            //处理完以后是个数组

  // 处理arr中的内容
  let arr2 = arr.map(item=>{

    // 1.处理arr中字符串的部分,是'string'原样返回
    if(typeof item == 'string'){
      return "'"+item+"'";
    }else{

    // 2.处理arr中表达式部分,replace加'data.' 解决json.a被处理成 'data.json.data.a'的情况
      let str = item.expr.replace(/.?[\$_a-z][a-z0-9_\$]*/ig,function(s){

        if(/[\$_a-z]/i.test(s[0])){

          // 调用parseGlobal解决...
          return parseGlobal(s,'data.'+s)
        }else{
          if(s[0]== '.'){
            return s
          }else{
            // 调用parseGlobal解决...
            return s[0]+parseGlobal(s.substring(1),'data.'+s.substring(1))
          }
        }

      })
      return str

    }
  })
  let str2 = arr2.join('')
    // console.log(str)
    // console.log(str2,data.$route)
    // console.log(data.arr,data.a)

  // filters实现1.12
  let result = eval(str2)
  strArr.slice(1).forEach(name=>{
    assert(filters[name],`"${name}" filters can not found`)
    result = filters[name](result)
  })

  return result
}


// 处理标签内的自定义指令字符串
function parseExpr(str){
  // 思路:把单引号或者双引号包裹的字符串 和 除了字符串的 其他表达式部分 也放进数组
  let arr = []

  while(1){
    let n = str.search(/'|"/)
    if(n==-1){
      // 关键2:在所有字符串都找到 循环结束前 把最后剩余的表达式 push进arr
      arr.push({expr:str})
      break
    }

    let m = n+1
    while(1){
      m = str.indexOf(str[n],m)
      if(m==-1){
        throw new Error('引号没有配对')
      }

      if(str[m-1] == '\\'){
        m++;
        continue;
      }else{
        break;
      }
    }
    // 关键1:把字符串以外部分push进arr
    arr.push({expr:str.substring(0,n)})
    arr.push(str.substring(n+1,m))
    str = str.substring(m+1)
  }

  return arr
}

// 处理{{xxx}} 类型表达式字符串
export function compileStringTemplate(str,data,filters){
  // {{xxxx}}
  let s = 0

  //
  let arr = []

  let n = 0

  while((n=str.indexOf('{{',s))!= -1){
    arr.push(str.substring(s,n))    //?


    let count1 = 2
    let end
    for(let i=n+2;i<str.length;i++){

      if(str[i]=='{'){
        count1++
      }else if(str[i]=='}'){
        count1--
      }

      if(count1==0){
        end=i;
        break;
      }
    }

    if(count1>0){
        throw new Error('花括号不匹配')
      }

    let strExpr = str.substring(n+2,end-1)
    let result = expression(strExpr,data,filters)

    // console.log(strExpr,result)

    if(typeof result == 'object'){
      arr.push(JSON.stringify(result))
    }else{
      arr.push(result)
    }

    s = end+1;
  }
  arr.push(str.substring(s))

  // console.log(arr)

  return arr.join('')

}