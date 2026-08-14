// 修女与女忍的双面日常 · MVU Zod Schema
// 用法：随角色卡作为酒馆助手脚本加载；z 由酒馆助手全局注入，禁止再从 CDN 引 zod（跨实例地雷）。
// 依据：~/STDB/B1_变量更新规则.md §3、§7.1 标准模板

let registerMvuSchema;
try {
  ({ registerMvuSchema } = await import(
    'https://cdn.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
} catch (error) {
  ({ registerMvuSchema } = await import(
    'https://testingcf.jsdelivr.net/gh/StageDog/tavern_resource/dist/util/mvu_zod.js'
  ));
}

// 本地 clamp，避免依赖 lodash 是否可用
const clampNum = (min, max) => v => Math.min(max, Math.max(min, v));
const Stat100 = () => z.coerce.number().transform(clampNum(0, 100)).prefault(0);
const Coin = () => z.coerce.number().transform(clampNum(0, Number.MAX_SAFE_INTEGER)).prefault(0);
const Level = () => z.coerce.number().transform(v => Math.max(1, Math.min(Number.MAX_SAFE_INTEGER, v))).prefault(1);
const 体力条 = () => z.coerce.number().transform(clampNum(0, 100)).prefault(100);

const 任务Schema = z.object({
  委托方: z.string().prefault(''),
  目标: z.string().prefault(''),
  地点: z.string().prefault(''),
  难度: z.string().prefault('普通'),
  状态: z.string().prefault('进行中'),
  败北值: Stat100(),
  报酬: Coin(),
}).prefault({});

const 村民Schema = z.object({
  身份: z.string().prefault(''),
  好感度: Stat100(),
  备注: z.string().prefault(''),
}).prefault({});

const Schema = z.object({
  环境: z.object({
    日期: z.string().prefault(''),
    时段: z.string().prefault('清晨'),
    经过天数: Coin(),
    阶段: z.string().prefault('白天经营'),
    所在位置: z.string().prefault(''),
  }).prefault({}),
  教堂: z.object({
    持有资金: Coin(),
    累计捐款: Coin(),
    修缮进度: Stat100(),
    民声: Stat100(),
    教堂等级: Level(),
    今日善行: Coin(),
  }).prefault({}),
  莉莉安: z.object({
    体力: 体力条(),
    羞耻值: Stat100(),
    秘密暴露度: Stat100(),
    忍务等级: Level(),
    当前衣着: z.string().prefault(''),
    身体状态: z.string().prefault('良好'),
  }).prefault({}),
  任务: z.record(z.string(), 任务Schema).prefault({}),
  村民: z.record(z.string(), 村民Schema).prefault({}),
  近期事件: z.array(z.string()).prefault([]),
});

$(() => { registerMvuSchema(Schema); });
