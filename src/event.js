export default class eventQueue{
  constructor(){
    this.events = {}
  }

  $on(name,fn){
    this.events[name] = this.events[name] || []
    this.events[name].push(fn)
  }

  $emit(name,...args){
    if(this.events[name]){
      this.events[name].forEach(fn=>{
        fn.call(this,...args)
      })
    }
  }
}