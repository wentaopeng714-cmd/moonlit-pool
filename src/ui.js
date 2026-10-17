import { PRESETS, PALETTES, SHAPE_LIST, PATTERN_LIST, GLITTER, INSIDE, MOODS, normalizeDesign } from './presets.js';
const paths={sound:'<path d="M4 9h4l5-4v14l-5-4H4zM17 8a6 6 0 0 1 0 8"/>',mute:'<path d="M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6"/>',overhead:'<rect x="3" y="6" width="18" height="12" rx="6"/><circle cx="12" cy="12" r="2"/>',save:'<path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4"/>',reset:'<path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>',shuffle:'<path d="M3 7h3c5 0 6 10 11 10h4M17 13l4 4-4 4M3 17h3c2 0 3-1 4-3M13 9c1-2 2-2 4-2h4M17 3l4 4-4 4"/>',film:'<rect x="3" y="5" width="18" height="14" rx="1"/><path d="m10 9 5 3-5 3z"/>'};
const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">${paths[k]||''}</svg>`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STORE='moonlit-recipes-v2';
const SHAPE_ICONS={sphere:'<circle cx="25" cy="25" r="14"/>',moon:'<path d="M32 10a16 16 0 1 0 8 26 14 14 0 0 1-8-26z"/>',heart:'<path d="M25 39 11 25C0 11 18 3 25 17c7-14 25-6 14 8z"/>',star:'<path d="m25 8 5 11 12 1-9 9 3 13-11-7-11 7 3-13-9-9 12-1z"/>'};
export class UI {
 constructor(root,h){
  this.root=root;this.h=h;this.tab='colour';this.thumbs={};this.recipes=[];
  try{const saved=JSON.parse(localStorage.getItem(STORE)||'[]');if(Array.isArray(saved))this.recipes=saved.filter(x=>x&&typeof x.name==='string'&&x.design).slice(0,12).map((x,i)=>({id:String(i),name:x.name.slice(0,18),design:normalizeDesign(x.design)}));}catch{}
  root.innerHTML=`
  <aside class="atelier" aria-label="香丸工作台">
   <header class="masthead"><div class="edition">月下染池 <span>第二辑 / 调色手记</span></div><div class="title-row"><h1>染池<span>。</span></h1><span class="red-seal">亲手<br>调制</span></div><div class="imprint">CHROMATIC BATH <span>EST. 2026</span></div></header>
   <section class="specimen" aria-label="当前香丸预览"><span class="specimen-no">SPECIMEN<br>NO. <b>01</b></span><img class="bomb-preview" alt="当前香丸的实际造型和纹样预览"><span class="specimen-name"></span><button class="shuffle" data-tool="shuffle" title="随机搭配造型、配色与内含物">${svg('shuffle')}随配</button></section>
   <nav class="chapter-tabs" role="tablist" aria-label="配方编辑"><button role="tab" data-tab="colour">一 · 调色</button><button role="tab" data-tab="form">二 · 塑形</button><button role="tab" data-tab="finish">三 · 入料</button></nav>
   <div class="recipe-body"><section class="panel" id="panel-colour" role="tabpanel" aria-label="调色"><div class="section-title">色谱 <small>选一方，再自由改色</small></div><div class="palette-grid"></div><div class="section-title three-colours">三色自配 <small>点击色块自选颜色</small></div><div class="ink-wells"></div><div class="rule-heading"><label for="concentration">每丸染料浓度</label><output id="concentration-value">240%</output></div><input id="concentration" type="range" min="20" max="400" step="10" data-range="concentration" aria-label="每丸染料浓度"><div class="range-ends"><span>淡染 · 20%</span><span>浓墨 · 400%</span></div><p class="field-note">自由改色与浓度作用于下一颗香丸。</p></section>
   <section class="panel" id="panel-form" role="tabpanel" aria-label="塑形" hidden><div class="section-title">外形 <small>四种模具</small></div><div class="shape-grid"></div><div class="section-title">表面纹样 <small>决定颜色释放的层次</small></div><div class="pattern-grid"></div><div class="rule-heading"><label for="rate">溶解速度</label><output id="rate-value">1.0×</output></div><input id="rate" type="range" min="50" max="200" step="10" data-range="rate" aria-label="溶解速度"><div class="range-ends"><span>慢释</span><span>速溶</span></div></section>
   <section class="panel" id="panel-finish" role="tabpanel" aria-label="入料" hidden><div class="section-title">闪粉 <small>沉入水中的细碎光点</small></div><div class="glitter-grid option-grid"></div><div class="section-title">内含物 <small>溶解后释放</small></div><div class="inside-grid option-grid"></div><div class="rule-heading"><label for="foam">起泡量</label><output id="foam-value">45%</output></div><input id="foam" type="range" min="0" max="150" step="5" data-range="foam" aria-label="起泡量"><div class="range-ends"><span>无泡</span><span>绵密</span></div></section>
   <div class="recipe-library"><div class="library-heading"><span>我的配方 <small class="recipe-count">0 / 12</small></span><button class="save-recipe">＋ 收录此方</button></div><div class="saved-recipes"></div></div></div>
   <div class="atelier-bottom"><span>配方保存在此浏览器</span><button class="about-toggle">原作 / 致谢 ↗</button></div>
  </aside>
  <header class="scene-top"><span class="scene-kicker">水面实验 <i>／</i> <b>CHROMATIC STUDY</b></span><div class="moods" role="group" aria-label="场景光照"></div><button class="sound" data-tool="mute" title="开启水声" aria-label="开启水声" aria-pressed="false">${svg('mute')}</button></header>
  <div class="scene-caption"><span>色随水转</span><small>DRAG TO STIR</small></div>
  <div class="scene-tools" role="toolbar" aria-label="画面工具"><button data-tool="overhead" title="切换俯瞰 · O">${svg('overhead')}俯瞰</button><button data-tool="cinematic" title="镜头漫游 · C">${svg('film')}漫游</button><button data-tool="save" title="导出 2400 × 1100 PNG · P">${svg('save')}取景</button><button data-tool="reset" title="清空水面重新开始">${svg('reset')}换水</button></div>
  <div class="scene-bottom"><div class="session"><span class="session-number">01—</span><span class="hint" aria-live="polite"></span><small class="population">0 丸在池</small></div><button class="drop" data-tool="drop" title="投入当前香丸，也可按空格"><span class="drop-circle">投</span><span class="drop-label">投入香丸<small>SPACE / 点按水面</small></span></button></div>
  <button class="mobile-toggle" aria-expanded="false">调配香丸 <span>＋</span></button>
  <dialog class="save-dialog"><form method="dialog"><span class="dialog-eyebrow">收录 / RECIPE BOOK</span><h2>给这一方起个名字</h2><label for="recipe-name">配方名称</label><input id="recipe-name" name="recipe-name" maxlength="18" autocomplete="off" required placeholder="如：青黛，三分金"><div class="dialog-actions"><button value="cancel" formnovalidate>取消</button><button value="save" class="confirm-save">收录此方 ↗</button></div></form></dialog>
  <dialog class="about"><form method="dialog"><button class="close-about">×</button></form><span class="dialog-eyebrow">月下染池 / 第二辑</span><h2>一颗香丸，一池颜色。</h2><p>自由搭配造型、纹样、三种颜色、染料浓度和内含物。点按水面投香，拖动搅水。每次投放保留当时的配方，新的修改不会改变已入水的香丸。</p><p>基于 Techartist 的 Fizz / bath-bomb-builder 改作，保留 GPU 流体与多层水面渲染。</p><a href="https://github.com/iamtechartist/bath-bomb-builder" target="_blank" rel="noopener">Techartist 原作 ↗</a> · <a href="LICENSE" target="_blank">MIT 许可</a></dialog><div class="toast" role="status"></div>`;
  this.hintEl=root.querySelector('.hint');this.toastEl=root.querySelector('.toast');
  root.addEventListener('click',e=>{
   const tool=e.target.closest('[data-tool]');if(tool){h.onTool?.(tool.dataset.tool,tool);if(tool.dataset.tool==='drop'&&innerWidth<700)this.closeMobile();return;}
   const tab=e.target.closest('[data-tab]');if(tab){this.tab=tab.dataset.tab;this.renderTabs();return;}
   const preset=e.target.closest('[data-preset]');if(preset){h.onPreset?.(preset.dataset.preset);return;}
   const opt=e.target.closest('[data-option]');if(opt){h.onDesign?.({[opt.dataset.option]:opt.dataset.value});return;}
   const mood=e.target.closest('[data-mood]');if(mood){h.onMood?.(mood.dataset.mood);return;}
   const load=e.target.closest('[data-recipe]');if(load){const r=this.recipes.find(x=>x.id===load.dataset.recipe);if(r){h.onRecipe?.(r.design);this.toast('已载入：'+r.name);}return;}
   const remove=e.target.closest('[data-remove]');if(remove){const next=this.recipes.filter(x=>x.id!==remove.dataset.remove);if(this.persist(next)){this.recipes=next;this.renderLibrary();}return;}
  });
  root.addEventListener('input',e=>{const input=e.target;if(input.dataset.range){const v=+input.value/100;root.querySelector('#'+input.id+'-value').textContent=input.id==='rate'?v.toFixed(1)+'×':input.value+'%';}if(input.dataset.color!==undefined){const hex=root.querySelector(`[data-hex="${input.dataset.color}"]`);if(hex)hex.textContent=input.value.toUpperCase();}});
  root.addEventListener('change',e=>{const el=e.target;if(el.dataset.range)h.onDesign?.({[el.dataset.range]:+el.value/100});if(el.dataset.color!==undefined){const colors=[...this.design.colors];colors[+el.dataset.color]=el.value;h.onDesign?.({colors});}});
  const save=root.querySelector('.save-dialog');root.querySelector('.save-recipe').onclick=()=>{if(this.recipes.length>=12){this.toast('配方册已收录 12 方，请先移除一方');return;}root.querySelector('#recipe-name').value=this.currentName();save.returnValue='cancel';save.showModal();};
  save.addEventListener('close',()=>{if(save.returnValue!=='save')return;const name=root.querySelector('#recipe-name').value.trim();if(!name)return;const next=[...this.recipes,{id:Date.now().toString(36),name,design:normalizeDesign(this.design)}];if(this.persist(next)){this.recipes=next;this.renderLibrary();this.toast('已收录：'+name);}});
  root.querySelector('.about-toggle').onclick=()=>root.querySelector('.about').showModal();
  root.querySelector('.mobile-toggle').onclick=()=>{const open=root.classList.toggle('editing');root.querySelector('.mobile-toggle').setAttribute('aria-expanded',String(open));root.querySelector('.mobile-toggle span').textContent=open?'−':'＋';};
  root.querySelector('.chapter-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...root.querySelectorAll('[data-tab]')];let i=tabs.findIndex(x=>x.dataset.tab===this.tab);i=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;this.tab=tabs[i].dataset.tab;this.renderTabs();tabs[i].focus();});
  this.renderLibrary();this.hint('点按投香 · 拖动搅水');
 }
 closeMobile(){this.root.classList.remove('editing');this.root.querySelector('.mobile-toggle').setAttribute('aria-expanded','false');this.root.querySelector('.mobile-toggle span').textContent='＋';}
 currentName(){return PRESETS.find(p=>p.id===this.preset)?.name||'自调方';}
 setState(design,mood,preset){this.design=design;this.mood=mood;this.preset=preset;this.render();}
 render(){
  if(!this.design)return;const d=this.design;
  this.root.querySelector('.specimen-name').textContent=this.currentName();
  this.root.querySelector('.palette-grid').innerHTML=PRESETS.map((p,i)=>`<button data-preset="${p.id}" aria-pressed="${this.preset===p.id}" class="palette ${this.preset===p.id?'sel':''}"><span class="palette-index">0${i+1}</span><span class="palette-dots">${PALETTES[p.palette].colors.map(c=>`<i style="--ink:${c}"></i>`).join('')}</span><span>${p.name}</span></button>`).join('');
  this.root.querySelector('.ink-wells').innerHTML=d.colors.map((c,i)=>`<label class="ink-well"><span class="ink-label">${['主色','伴色','芯色'][i]} <b>0${i+1}</b></span><span class="ink-patch" style="--ink:${c}"><input type="color" value="${c}" data-color="${i}" aria-label="${['主色','伴色','芯色'][i]}"></span><span class="hex" data-hex="${i}">${c.toUpperCase()}</span></label>`).join('');
  this.root.querySelector('.shape-grid').innerHTML=SHAPE_LIST.map(s=>`<button class="shape-option ${d.shape===s.id?'sel':''}" data-option="shape" data-value="${s.id}" aria-pressed="${d.shape===s.id}"><svg viewBox="0 0 50 50">${SHAPE_ICONS[s.id]}</svg><span>${s.name}</span></button>`).join('');
  this.root.querySelector('.pattern-grid').innerHTML=PATTERN_LIST.map(p=>`<button class="pattern-option ${d.pattern===p.id?'sel':''}" data-option="pattern" data-value="${p.id}" aria-pressed="${d.pattern===p.id}"><i class="pattern-${p.id}" style="--a:${d.colors[0]};--b:${d.colors[1]};--c:${d.colors[2]}"></i><span>${p.name}</span></button>`).join('');
  this.root.querySelector('.glitter-grid').innerHTML=Object.entries(GLITTER).map(([k,g])=>`<button data-option="glitter" data-value="${k}" aria-pressed="${d.glitter===k}" class="${d.glitter===k?'sel':''}">${g.name}</button>`).join('');
  this.root.querySelector('.inside-grid').innerHTML=Object.entries(INSIDE).map(([k,g])=>`<button data-option="inside" data-value="${k}" aria-pressed="${d.inside===k}" class="${d.inside===k?'sel':''}">${g.name}</button>`).join('');
  this.root.querySelector('.moods').innerHTML=Object.entries(MOODS).map(([k,m])=>`<button data-mood="${k}" aria-pressed="${this.mood===k}" class="${this.mood===k?'sel':''}">${m.name}</button>`).join('');
  for(const k of ['concentration','rate','foam']){this.root.querySelector('#'+k).value=Math.round(d[k]*100);this.root.querySelector('#'+k+'-value').textContent=k==='rate'?d[k].toFixed(1)+'×':Math.round(d[k]*100)+'%';}
  this.updatePreview();this.renderTabs();
 }
 renderTabs(){for(const b of this.root.querySelectorAll('[data-tab]')){b.setAttribute('aria-selected',String(b.dataset.tab===this.tab));b.id='tab-'+b.dataset.tab;b.setAttribute('aria-controls','panel-'+b.dataset.tab);}for(const panel of this.root.querySelectorAll('.panel')){panel.hidden=panel.id!=='panel-'+this.tab;panel.setAttribute('aria-labelledby',panel.id.replace('panel-','tab-'));}}
 updatePreview(){const key='live:'+JSON.stringify(this.design);const url=this.thumbs[key];if(url){const im=this.root.querySelector('.bomb-preview');im.src=url;im.classList.add('ready');}}
 setThumb(key,url){this.thumbs[key]=url;if(key==='live:'+JSON.stringify(this.design))this.updatePreview();}
 persist(recipes){try{localStorage.setItem(STORE,JSON.stringify(recipes));return true;}catch{this.toast('浏览器未允许存储，配方未保存');return false;}}
 renderLibrary(){this.root.querySelector('.recipe-count').textContent=this.recipes.length+' / 12';this.root.querySelector('.saved-recipes').innerHTML=this.recipes.length?this.recipes.map(r=>`<div class="saved-row"><button data-recipe="${esc(r.id)}"><span class="recipe-colors">${r.design.colors.map(c=>`<i style="background:${c}"></i>`).join('')}</span>${esc(r.name)}</button><button data-remove="${esc(r.id)}" aria-label="移除配方 ${esc(r.name)}" title="移除此方">×</button></div>`).join(''):'<p>还没有收录。调好颜色，存下你的第一方。</p>';}
 setPopulation(n){this.root.querySelector('.population').textContent=n+' 丸在池';}
 hint(text){this.hintEl.textContent=text;}
 toast(text){this.toastEl.textContent=text;this.toastEl.classList.add('on');clearTimeout(this._tt);this._tt=setTimeout(()=>this.toastEl.classList.remove('on'),2600);}
 setMuted(m){const b=this.root.querySelector('[data-tool="mute"]');b.innerHTML=svg(m?'mute':'sound');b.setAttribute('aria-pressed',String(!m));b.title=m?'开启水声':'关闭水声';b.setAttribute('aria-label',b.title);}
 setActive(tool,on){this.root.querySelector(`[data-tool="${tool}"]`)?.classList.toggle('on',on);}
 setHidden(v){this.root.classList.toggle('hidden',v);}
 setDark(v){this.root.classList.toggle('daylight',!v);}
}
