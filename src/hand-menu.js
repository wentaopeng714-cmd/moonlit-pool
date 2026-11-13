import { PRESETS, SHAPE_LIST, PATTERN_LIST, GLITTER, INSIDE, MOODS } from './presets.js';

const items = list => list.map(({id,name}) => ({id,name}));
const entries = group => Object.entries(group).map(([id,{name}]) => ({id,name}));
const groups = [
  { id:'preset', name:'色谱', choices:items(PRESETS) },
  { id:'shape', name:'造型', choices:items(SHAPE_LIST) },
  { id:'pattern', name:'纹样', choices:items(PATTERN_LIST) },
  { id:'glitter', name:'闪粉', choices:entries(GLITTER) },
  { id:'inside', name:'内含物', choices:entries(INSIDE) },
  { id:'mood', name:'光照', choices:entries(MOODS) },
  { id:'view', name:'视角', choices:[{id:'overhead',name:'俯瞰'},{id:'cinematic',name:'漫游'}] },
];

export function createHandMenu(ui) {
  const entry = document.createElement('button');
  entry.type = 'button';
  entry.className = 'gesture-menu-entry';
  entry.textContent = '手势选项';
  entry.title = '抬高手指点亮按钮，再捏合打开；也可直接点击';
  entry.setAttribute('aria-expanded', 'false');
  entry.setAttribute('aria-controls', 'gesture-options');
  const panel = document.createElement('section');
  panel.id = 'gesture-options';
  panel.className = 'gesture-options';
  panel.hidden = true;
  panel.setAttribute('aria-labelledby', 'gesture-options-title');
  panel.innerHTML = '<header><strong id="gesture-options-title">手势选项</strong><small>移动手指高亮 · 捏合确认</small></header><div class="gesture-options-grid"></div>';
  document.body.append(entry,panel);
  const grid = panel.querySelector('.gesture-options-grid');
  const title = panel.querySelector('strong');
  let category = null, hover = -1, choices = [];
  const close = () => { panel.hidden = true; entry.setAttribute('aria-expanded','false'); entry.classList.remove('aim'); };
  function show(group = null) {
    category = group;
    choices = group ? [...group.choices, {name:'返回',id:'back'}, {name:'回到水面',id:'close'}]
      : [...groups, {name:'回到水面',id:'close'}];
    title.textContent = group?.name || '手势选项';
    grid.replaceChildren(...choices.map((choice,i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = choice.name;
      button.onclick = () => choose(i);
      return button;
    }));
    hover = -1;
    panel.hidden = false;
    entry.setAttribute('aria-expanded','true');
  }
  function choose(index) {
    const choice = choices[index];
    if (!choice) return;
    if (choice.id === 'close') return close();
    if (choice.id === 'back') return show();
    if (!category) return show(choice);
    const group = category.id;
    if (group === 'preset') ui.h.onPreset(choice.id);
    else if (group === 'mood') ui.h.onMood(choice.id);
    else if (group === 'view') ui.h.onTool(choice.id);
    else ui.h.onDesign({[group]:choice.id});
    close();
    ui.toast('已选择：' + choice.name);
  }
  entry.onclick = () => panel.hidden ? show() : close();
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !panel.hidden) close(); });
  ui.root.querySelector('.mobile-toggle').addEventListener('click', close);
  function target(index) {
    if (hover !== index) {
      grid.children[hover]?.classList.remove('aim');
      grid.children[index]?.classList.add('aim');
      hover = index;
    }
  }
  return {
    close,
    // While the options are open the same pinch confirms a tile instead of dropping a bomb.
    handle(hand) {
      if (!hand) { entry.classList.remove('aim'); target(-1); return false; }
      if (!panel.hidden) {
        const row = Math.min(Math.ceil(choices.length / 3) - 1, Math.floor(hand.v * Math.ceil(choices.length / 3)));
        const col = Math.min(2, Math.floor(hand.u * 3));
        if (!hand.closed || hover < 0) target(row * 3 + col);
        if (hand.drop) choose(hover);
        return true;
      }
      const nearEntry = hand.v < .14;
      entry.classList.toggle('aim', nearEntry);
      if (nearEntry && hand.drop) { show(); return true; }
      return nearEntry;
    },
  };
}
