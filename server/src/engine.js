import {Subject,filter,map,scan,tap} from 'rxjs';
import {validateGraph} from './graph.js';
const cmp=(v,op,l)=>({'>':v>l,'>=':v>=l,'<':v<l,'<=':v<=l})[op]??false;
export class RuleEngine{
 constructor(onAlert){this.stream=new Subject();this.subscriptions=[];this.onAlert=onAlert}
 deploy(graph){
  const {paths}=validateGraph(graph);for(const s of this.subscriptions)s.unsubscribe();this.subscriptions=[];
  for(const path of paths){
   const source=path[0],ops=[filter(p=>p.metadata.sensor===source.data.sensor),map(p=>({...p,current:p.value}))];
   for(const n of path.slice(1)){
    if(n.type==='average'){
     const window=Number(n.data.window);
     ops.push(scan((s,p)=>{const values=[...s.values,p.current].slice(-window);return{values,point:{...p,current:values.reduce((a,b)=>a+b,0)/values.length}}},{values:[],point:null}),map(s=>s.point));
    }else if(n.type==='threshold')ops.push(filter(p=>cmp(p.current,n.data.operator,Number(n.data.limit))));
    else if(n.type==='alert')ops.push(tap(p=>this.onAlert({sensor:p.metadata.sensor,value:p.value,evaluatedValue:p.current,message:String(n.data.message||'Rule triggered').slice(0,200),at:p.timestamp,nodeId:n.id})));
   }
   this.subscriptions.push(this.stream.pipe(...ops).subscribe({error:e=>console.error('RxJS pipeline:',e.message)}));
  }
  return {deployedPaths:this.subscriptions.length};
 }
 ingest(point){this.stream.next(point)}
 close(){for(const s of this.subscriptions)s.unsubscribe();this.stream.complete()}
}
