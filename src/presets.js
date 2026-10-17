export const PALETTES={
 moon:{name:'青黛',colors:['#4020e8','#00bfc9','#9e50ff']},
 rose:{name:'胭脂',colors:['#f11d67','#ff643d','#ffd04b']},
 pine:{name:'松烟',colors:['#00765b','#18c891','#e4a52c']},
 ocean:{name:'碧海',colors:['#0846ed','#00c8da','#39f4c4']},
 lavender:{name:'藤紫',colors:['#6429ef','#e446ee','#387aff']},
 candy:{name:'桃夭',colors:['#fc65b7','#54cafa','#ad67ef']}
};
export const SHAPE_LIST=[{id:'sphere',name:'圆丸'},{id:'moon',name:'弦月'},{id:'heart',name:'花心'},{id:'star',name:'星芒'}];
export const PATTERN_LIST=[{id:'marble',name:'云纹'},{id:'ombre',name:'渐染'},{id:'stripes',name:'叠层'},{id:'speckle',name:'散点'},{id:'galaxy',name:'星云'}];
export const GLITTER={none:{name:'无闪粉',color:null},gold:{name:'金',color:'#ffc95a'},silver:{name:'银',color:'#e8eef7'},holo:{name:'幻彩',color:'holo'},rose:{name:'玫瑰金',color:'#ffb0a0'}};
export const INSIDE={none:{name:'无'},petals:{name:'花瓣'},lavender:{name:'薰衣草'},goldleaf:{name:'金箔'},confetti:{name:'彩纸'},duck:{name:'小鸭'}};
export const MOODS={night:{name:'月下'},golden:{name:'暮色'},morning:{name:'清晓'}};
export const PRESETS=[
{id:'moon',name:'青黛入水',shape:'sphere',palette:'moon',pattern:'marble',glitter:'silver',inside:'petals'},
{id:'rose',name:'胭脂流金',shape:'heart',palette:'rose',pattern:'marble',glitter:'rose',inside:'petals'},
{id:'pine',name:'松绿琥珀',shape:'sphere',palette:'pine',pattern:'speckle',glitter:'gold',inside:'goldleaf'},
{id:'ocean',name:'碧海生潮',shape:'moon',palette:'ocean',pattern:'ombre',glitter:'silver',inside:'duck'},
{id:'lavender',name:'藤影星云',shape:'sphere',palette:'lavender',pattern:'galaxy',glitter:'holo',inside:'lavender'},
{id:'candy',name:'桃夭',shape:'star',palette:'candy',pattern:'stripes',glitter:'holo',inside:'confetti'}];
const clamp=(x,a,b,d)=>Number.isFinite(+x)?Math.min(b,Math.max(a,+x)):d;
export function normalizeDesign(d={}){
 const palette=Object.hasOwn(PALETTES,d.palette)?d.palette:'moon';
 return {palette,shape:SHAPE_LIST.some(s=>s.id===d.shape)?d.shape:'sphere',pattern:PATTERN_LIST.some(p=>p.id===d.pattern)?d.pattern:'marble',glitter:Object.hasOwn(GLITTER,d.glitter)?d.glitter:'silver',inside:Object.hasOwn(INSIDE,d.inside)?d.inside:'petals',colors:Array.isArray(d.colors)&&d.colors.length===3&&d.colors.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c))?[...d.colors]:[...PALETTES[palette].colors],concentration:clamp(d.concentration,.2,4,2.4),rate:clamp(d.rate,.5,2,1),foam:clamp(d.foam,0,1.5,.25),seed:clamp(d.seed,0,100,2)};
}
export function designFromPreset(p){return normalizeDesign({...p,seed:Math.random()*10});}
export function randomDesign(rng=Math.random){const pick=a=>a[Math.floor(rng()*a.length)];return normalizeDesign({palette:pick(Object.keys(PALETTES)),shape:pick(SHAPE_LIST).id,pattern:pick(PATTERN_LIST).id,glitter:pick(Object.keys(GLITTER)),inside:pick(Object.keys(INSIDE)),concentration:1.8+rng()*1.6,seed:rng()*10});}
