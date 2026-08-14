// 组装脚本：从 部件/ 源码生成可导入产物
// 用法：node build.mjs（在本目录下运行）
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const P = (...segs) => join(ROOT, '部件', ...segs);
const rd = p => readFileSync(p, 'utf8');

const CARD_NAME = '修女与女忍的双面日常';

// ---------- 世界书 ----------
const manifest = JSON.parse(rd(P('worldbook', 'manifest.json')));
const entries = manifest.map((m, i) => ({
  uid: i,
  ...m,
  content: rd(P('worldbook', m.file)).replace(/\r\n/g, '\n').trim(),
}));

// ST 世界书导入格式（独立文件）
const POS_NUM = { before_char: 0, after_char: 1 };
const worldbook = {
  entries: Object.fromEntries(entries.map(e => [String(e.uid), {
    uid: e.uid,
    key: e.keys,
    keysecondary: [],
    comment: e.name,
    content: e.content,
    constant: e.constant,
    vectorized: false,
    selective: e.keys.length > 0,
    selectiveLogic: 0,
    addMemo: true,
    order: e.order,
    position: POS_NUM[e.position],
    disable: !e.enabled,
    excludeRecursion: false,
    preventRecursion: false,
    delayUntilRecursion: false,
    probability: 100,
    useProbability: true,
    depth: 4,
    group: '',
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: null,
    automation_id: '',
    role: 0,
    sticky: 0,
    cooldown: 0,
    delay: 0,
    displayIndex: e.uid,
  }])),
};
writeFileSync(join(ROOT, `世界书_${CARD_NAME}.json`), JSON.stringify(worldbook, null, 2));

// 卡内嵌 character_book（charaCard V2 形态）
const character_book = {
  name: CARD_NAME,
  entries: entries.map(e => ({
    id: e.uid,
    keys: e.keys,
    secondary_keys: [],
    comment: e.name,
    content: e.content,
    constant: e.constant,
    selective: e.keys.length > 0,
    insertion_order: e.order,
    enabled: e.enabled,
    position: e.position,
    extensions: {
      position: POS_NUM[e.position],
      exclude_recursion: false,
      display_index: e.uid,
      probability: 100,
      useProbability: true,
      depth: 4,
      selectiveLogic: 0,
      group: '',
      group_override: false,
      group_weight: 100,
      prevent_recursion: false,
      delay_until_recursion: false,
      scan_depth: null,
      match_whole_words: null,
      use_group_scoring: false,
      case_sensitive: null,
      automation_id: '',
      role: 0,
      vectorized: false,
      sticky: 0,
      cooldown: 0,
      delay: 0,
    },
  })),
};

// ---------- 正则 ----------
const statusbarHtml = rd(P('statusbar', '状态栏.html')).replace(/\r\n/g, '\n').trim();
const regexScripts = [
  {
    scriptName: 'MVU·去除变量更新',
    findRegex: '/<UpdateVariable>[\\s\\S]*?<\\/UpdateVariable>/gm',
    replaceString: '',
    markdownOnly: true, promptOnly: true,
  },
  {
    scriptName: '状态栏渲染',
    findRegex: '/<StatusPlaceHolderImpl\\/>/g',
    replaceString: '```html\n' + statusbarHtml + '\n```',
    markdownOnly: true, promptOnly: false,
  },
].map((r, i) => ({
  id: `lilian-regex-${i}`,
  trimStrings: [],
  placement: [2],
  disabled: false,
  runOnEdit: true,
  substituteRegex: 0,
  minDepth: null,
  maxDepth: null,
  ...r,
}));
// 单独导出正则部件（供单独导入参考）
for (const r of regexScripts) {
  writeFileSync(P('regex', `${r.scriptName}.json`), JSON.stringify(r, null, 2));
}

// ---------- 酒馆助手脚本 ----------
const scripts = [
  { file: 'mvu_zod_cn.js', name: 'MVU Zod 加载（国内优先）', enabled: true },
  { file: 'mvu_zod_global.js', name: 'MVU Zod 加载（全球优先）', enabled: false },
  { file: 'zod_schema.js', name: 'MVU Zod Schema·双面日常', enabled: true },
].map((s, i) => ({
  type: 'script',
  enabled: s.enabled,
  name: s.name,
  id: `lilian-script-${i}`,
  content: rd(P('scripts', s.file)).replace(/\r\n/g, '\n'),
  info: '修女与女忍的双面日常 · 卡内封装部件',
  button: { enabled: false, buttons: [] },
  data: {},
}));

// ---------- 角色卡 ----------
const field = f => rd(P('card', f)).replace(/\r\n/g, '\n').trim();
const data = {
  name: CARD_NAME,
  description: field('description.md'),
  personality: field('personality.md'),
  scenario: field('scenario.md'),
  first_mes: field('first_mes.txt'),
  mes_example: field('mes_example.txt'),
  creator_notes: [
    'MVU Zod 变量卡。运行依赖：酒馆助手（宿主必须安装并启用）；MagVarUpdate bundle 与 mvu_zod.js 在运行时从 jsDelivr 远程加载（已随卡封装国内/全球两个加载脚本，默认启用国内优先，网络环境不同请切换）；Zod schema 已随卡封装，无需另行安装。',
    '变量更新默认走「随AI输出」同轮更新；本卡世界书已标注 [mvu_plot]/[mvu_update]，兼容「额外模型解析」模式。',
    '所有登场人物均为成年人。本卡含成人向内容规则。',
  ].join('\n\n'),
  system_prompt: '',
  post_history_instructions: '',
  alternate_greetings: [],
  tags: ['黄油', '喜剧', '修女', '女忍', '模拟经营', '潜入', 'MVU', 'GM卡'],
  creator: 'CardMaker',
  character_version: '1.0.0',
  character_book,
  extensions: {
    talkativeness: '0.5',
    fav: false,
    // ST 导入 JSON 卡时会把 character_book 抽取为同名世界书文件，必须显式挂主世界书
    world: CARD_NAME,
    depth_prompt: { prompt: '', depth: 4, role: 'system' },
    regex_scripts: regexScripts,
    tavern_helper: { scripts },
  },
};
const card = { spec: 'chara_card_v2', spec_version: '2.0', data, ...data };
writeFileSync(join(ROOT, `角色卡_${CARD_NAME}.json`), JSON.stringify(card, null, 2));

console.log('构建完成：');
console.log(`  角色卡_${CARD_NAME}.json`);
console.log(`  世界书_${CARD_NAME}.json`);
console.log(`  部件/regex/（2 条正则的独立导出）`);
console.log(`  世界书条目 ${entries.length} 条，正则 ${regexScripts.length} 条，脚本 ${scripts.length} 个`);
