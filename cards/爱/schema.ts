export const Schema = z.object({
  系统: z.object({
    当前阶段: z.enum(['磨合期', '损友成型', '裂痕觉醒', '变小危机', '清算']),
    当前任务: z.string().prefault(''),
    当前地点: z.string().prefault('玄天宗'),
  }),
  小穗: z.object({
    觉醒进度: z.coerce.number().prefault(0),
  }),
});

export type Schema = z.output<typeof Schema>;
