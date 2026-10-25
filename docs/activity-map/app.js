const $ = id => document.getElementById(id)
const svg = $('map'), world = $('world'), ns = 'http://www.w3.org/2000/svg'
const groups = {build:['Build · 서비스','#b7a077'],write:['Write · 기록','#7fa9ba'],community:['Connect · 커뮤니티','#a28bbb'],research:['Research · 연구','#8eaa94'],person:['Sangmyeong','#e7d7b7']}
let data, nodes, edges, selected = null, zoom = .66, pan = {x:0,y:0}, pointers = new Map(), gesture, moved = false
const filters = new Set(Object.keys(groups))
const el = (tag, attributes) => {const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attributes))e.setAttribute(k,v);return e}
function allowed(n){return filters.has(n.group) || n.id==='me'}
function visible(n){return allowed(n) && (n.level===0 || zoom >= (n.level===1 ? .95 : 1.65) || n.id===selected)}
function linked(id){const set=new Set([id]);for(const e of data.edges){if(e.source===id)set.add(e.target);if(e.target===id)set.add(e.source)}return set}
function render(){
 world.setAttribute('transform',`translate(${pan.x} ${pan.y}) scale(${zoom})`)
 const near=selected?linked(selected):null
 for(const n of data.nodes){const e=nodes.get(n.id);e.setAttribute('aria-hidden',String(!visible(n)));const label=e.querySelector('text');label.style.fontSize=(12/zoom)+'px';label.setAttribute('y',String(10+17/zoom));e.style.display=visible(n)?'':'none';e.setAttribute('tabindex',visible(n)?'0':'-1');e.classList.toggle('selected',selected===n.id);e.classList.toggle('dim',!!near&&!near.has(n.id));e.setAttribute('aria-pressed',String(selected===n.id))}
 for(const [i,e] of data.edges.entries()){const a=data.nodes.find(n=>n.id===e.source),b=data.nodes.find(n=>n.id===e.target);const line=edges[i];line.style.display=visible(a)&&visible(b)?'':'none';line.classList.toggle('active',!!near&&(e.source===selected||e.target===selected));line.classList.toggle('dim',!!near&&e.source!==selected&&e.target!==selected)}
 $('level').textContent=zoom<.95?'01 / OVERVIEW':zoom<1.65?'02 / CONNECTIONS':'03 / DETAILS'
 $('count').textContent=`${data.nodes.filter(visible).length} NODES · ${Math.round(zoom*100)}%`
}
function fit(){selected=null;$('detail').hidden=true;const rect=svg.getBoundingClientRect();const mobile=rect.width<720;zoom=Math.max(.2,Math.min(.75,(rect.width-(mobile?45:350))/1450,(rect.height-(mobile?210:130))/1120));pan={x:rect.width*(mobile?.5:.59),y:rect.height*.57};render()}
function zoomAt(amount,x,y){const next=Math.min(3,Math.max(.18,zoom*amount));pan.x=x-(x-pan.x)*next/zoom;pan.y=y-(y-pan.y)*next/zoom;zoom=next;render()}
function focus(id){
 const n=data.nodes.find(n=>n.id===id);if(!n)return
 filters.add(n.group);syncFilters();selected=id;zoom=Math.max(zoom,n.level===2?1.8:n.level===1?1.2:1.05)
 const rect=svg.getBoundingClientRect();pan={x:rect.width*(rect.width<720?.5:.48)-n.x*zoom,y:rect.height*(rect.width<720?.42:.52)-n.y*zoom}
 $('detail').hidden=false;$('detail-group').textContent=groups[n.group][0];$('detail-title').textContent=n.label;$('detail-description').textContent=n.description
 const a=$('detail-link');a.hidden=!n.url;if(n.url)a.href=n.url
 $('connections').replaceChildren();for(const other of linked(id)){if(other===id)continue;const target=data.nodes.find(n=>n.id===other);const button=document.createElement('button');button.textContent=target.label;button.onclick=()=>focus(other);$('connections').append(button)}
 render()
}
function syncFilters(){for(const b of $('filters').children)b.setAttribute('aria-pressed',String(filters.has(b.dataset.group)))}
function search(){const query=$('search').value.trim().toLowerCase();$('results').replaceChildren();if(!query)return;const found=data.nodes.filter(n=>(n.label+' '+n.description).toLowerCase().includes(query));if(!found.length){$('results').textContent='검색 결과가 없습니다.';return}for(const n of found){const b=document.createElement('button');b.textContent=n.label;b.onclick=()=>{focus(n.id);$('search').value='';$('results').replaceChildren()};$('results').append(b)}}
function point(e){const r=svg.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
svg.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoomAt(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false})
svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=point(e);pointers.set(e.pointerId,p);moved=false;const target=e.target.closest('.node');gesture={target:target?.dataset.id,start:p,pan:{...pan}};if(target){const n=data.nodes.find(n=>n.id===target.dataset.id);gesture.node={...n}}svg.setPointerCapture(e.pointerId);if(pointers.size===2)gesture={pinch:true,previous:[...pointers.values()]}})
svg.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const previous=pointers.get(e.pointerId),p=point(e);pointers.set(e.pointerId,p);if(pointers.size===2){const before=gesture.previous,after=[...pointers.values()];if(before){const d=a=>Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);const c=a=>({x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2});const a=c(before),b=c(after);pan.x+=b.x-a.x;pan.y+=b.y-a.y;if(d(before)>0)zoomAt(d(after)/d(before),b.x,b.y)}gesture.previous=after;moved=true;return}if(gesture?.pinch)return;if(Math.hypot(p.x-gesture.start.x,p.y-gesture.start.y)>4)moved=true;if(!moved)return;if(gesture.target){const n=data.nodes.find(n=>n.id===gesture.target);n.x+=(p.x-previous.x)/zoom;n.y+=(p.y-previous.y)/zoom;position()}else{pan.x+=p.x-previous.x;pan.y+=p.y-previous.y}render()})
function release(e){if(!pointers.has(e.pointerId))return;const target=gesture?.target;if(!moved&&target&&e.type!=='pointercancel')focus(target);pointers.delete(e.pointerId);if(!pointers.size)gesture=null;else gesture={pinch:true}}
svg.addEventListener('pointerup',release);svg.addEventListener('pointercancel',release)
function position(){for(const n of data.nodes)nodes.get(n.id).setAttribute('transform',`translate(${n.x},${n.y})`);for(const [i,e] of data.edges.entries()){const a=data.nodes.find(n=>n.id===e.source),b=data.nodes.find(n=>n.id===e.target);for(const [key,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))edges[i].setAttribute(key,v)}}
$('search').addEventListener('input',search)
$('zoom-in').onclick=()=>{const r=svg.getBoundingClientRect();zoomAt(1.45,r.width*.55,r.height*.5)}
$('zoom-out').onclick=()=>{const r=svg.getBoundingClientRect();zoomAt(1/1.45,r.width*.55,r.height*.5)}
$('fit').onclick=()=>{if(data)fit()};$('close-detail').onclick=()=>{selected=null;$('detail').hidden=true;render()}
document.addEventListener('keydown',e=>{if(e.key==='/'&&e.target.tagName!=='INPUT'){e.preventDefault();$('search').focus()}if(e.key==='Escape'){$('search').value='';$('results').replaceChildren();selected=null;$('detail').hidden=true;if(data)render()}})
new ResizeObserver(()=>{if(data)fit()}).observe(svg)
try{
 const response=await fetch(new URL('./data.json',import.meta.url));if(!response.ok)throw Error('Unable to load data');data=await response.json()
 nodes=new Map();edges=[]
 for(const e of data.edges){const line=el('line',{class:'edge'});edges.push(line);$('edges').append(line)}
 for(const n of data.nodes){const r=n.id==='me'?14:['build','write','community','research'].includes(n.id)?8:n.level?4:6;const g=el('g',{class:'node',role:'button',tabindex:'0','aria-label':n.label,'data-id':n.id,style:`--node:${groups[n.group][1]}`});g.append(el('circle',{r:r+7,class:'halo'}),el('circle',{r,class:'core'}));const text=el('text',{y:r+22});text.textContent=n.label;g.append(text);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();focus(n.id)}};nodes.set(n.id,g);$('nodes').append(g)}
 for(const [id,[name,color]] of Object.entries(groups)){if(id==='person')continue;const b=document.createElement('button');b.dataset.group=id;b.setAttribute('aria-pressed','true');b.style.setProperty('--c',color);const dot=document.createElement('i');b.append(dot,document.createTextNode(name));b.onclick=()=>{filters.has(id)?filters.delete(id):filters.add(id);if(selected&&!allowed(data.nodes.find(n=>n.id===selected))){selected=null;$('detail').hidden=true}syncFilters();render()};$('filters').append(b)}
 position();fit()
}catch(error){console.error(error);$('error').hidden=false}
