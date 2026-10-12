const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const model=fs.readFileSync('public/site/explore-model.js','utf8');
const app=fs.readFileSync('public/site/app.js','utf8');
const parsed=ts.createSourceFile('app.js',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
function functions(...names){return parsed.statements.filter(n=>ts.isFunctionDeclaration(n)&&names.includes(n.name?.text)).map(n=>n.getText(parsed)).join('\n');}
function context(extra={}){const c=vm.createContext({URL,...extra});vm.runInContext(model,c);return c;}
// Synthetic fixtures exist only in tests; they are never shipped as directory content.
const places=[{id:1,name:'Café Test',category:'food',barangay:'Port Barton',description:'Fresh fish',tip:'Ask about vegetarian meals',lat:10.4,lng:119.2},{id:2,name:'Test Cove',category:'beach',barangay:'Alimanguan',description:'Quiet coast',tip:'Bring water',lat:10.6,lng:119.3}];
const cats={food:{label:'Food & drinks'},beach:{label:'Beaches'}};
test('search combines words across name, category label, barangay, description and tip',()=>{
 const m=context().SanvicExplore;
 for(const query of ['cafe','drinks fish','port vegetarian'])assert.deepEqual(Array.from(m.filter(places,{query,category:'all',area:''},cats),x=>x.id),[1]);
 assert.equal(m.filter(places,{query:'quiet',category:'food',area:''},cats).length,0);
 assert.equal(m.filter(places,{query:'',category:'all',area:'alimanguan'},cats)[0].id,2);
 assert.equal(m.filter([],{query:'',category:'all',area:''},cats).length,0);
});
test('invalid coordinates and unsafe media URLs are rejected',()=>{
 const m=context().SanvicExplore;
 for(const lat of [null,undefined,'',NaN,91])assert.equal(m.hasCoordinates({lat,lng:119}),false);
 assert.equal(m.hasCoordinates({lat:0,lng:0}),true);
 for(const url of ['javascript:alert(1)','data:text/html,test','assets/../secret'])assert.equal(m.safeUrl(url,true),'');
 assert.equal(m.safeUrl('assets/beach.jpg',true),'assets/beach.jpg');
 assert.equal(m.distanceKm(places[0],places[0]),0);
});
test('all four basemaps preserve the independent boundary layer and selection',()=>{
 const present=new Set();const saved={};const classes=new Set();
 const map={hasLayer:l=>present.has(l),removeLayer:l=>present.delete(l)};
 const layer=()=>({addTo(){present.add(this);return this;}});
 const boundary=layer(),street=layer(),terrain=layer(),satellite=layer();boundary.addTo(map);
 const c=context({map,window:{_mS:street,_mTerrain:terrain,_mSatellite:satellite},sessionStorage:{setItem:(k,v)=>saved[k]=v},document:{body:{classList:{toggle:(k,on)=>on?classes.add(k):classes.delete(k)}},querySelectorAll:()=>[]},updateBarangayStyle(){},mapNotice(){}});
 vm.runInContext(functions('switchMapLayer'),c);
 for(const mode of ['street','dark','terrain','satellite','street']){
  c.switchMapLayer(mode);assert.equal(present.has(boundary),true);assert.equal(present.size,2);assert.equal(saved.sanvic_basemap,mode);assert.equal(classes.has('map-dark'),mode==='dark');
 }
});
test('successful empty directory is retained when an optional feature fails',async()=>{
 const noop=()=>{};
 const query=table=>{const result=table==='destinations'?{data:[],error:null}:{data:null,error:new Error('Optional unavailable')};const q={select:()=>q,order:()=>q,eq:()=>q,in:()=>q,maybeSingle:()=>q,then:(a,b)=>Promise.resolve(result).then(a,b)};return q;};
 const c=context({sb:{from:query},window:{},console:{warn:noop},document:{getElementById:()=>null},DEFAULT_DESTINATIONS:places,DEFAULT_TALA_DATA:[],DEFAULT_FALLBACK_RESPONSE:'',DEFAULT_SUGGESTIONS:[],DEFAULT_HERO_TITLE:'',DEFAULT_HERO_SUBTITLE:'',DEFAULT_SPLASH_SUBTEXT:'',DEFAULT_SPLASH_FOOTER:'',destRowToObj:x=>x,applyCategoriesFromRows:noop,applyNearbyPlacesFromRows:noop,applyHeroText:noop,applySplashText:noop});
 vm.runInContext(functions('loadDataFromSupabase'),c);await c.loadDataFromSupabase();
 assert.equal(c.destinationsSource,'supabase');assert.equal(c.window.destinations.length,0);
});
