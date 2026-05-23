# 动作阈值表

| 事件 | 输入特征 | 默认阈值 | 持续时间 | 失败反馈 |
|---|---|---:|---:|---|
| look_stable | ready 质量状态且无强动作 | 0.78 | 2000ms | 镜面还未定，请把脸放入圆框 |
| blink | eyeBlinkLeft/Right 平均值 | 0.45 | 即时 | 星光未落，再轻眨一次 |
| smile | mouthSmileLeft/Right 平均值 | 0.35 | 即时 | 镜中气未开，试试轻轻一笑 |
| brow_up | browOuterUpLeft/Right 平均值 | 0.35 | 即时 | 天庭未开，眉峰再轻扬 |
| mouth_open | jawOpen | 0.35 | 即时 | 口令不清，可改用按钮 |
| head_turn | yaw 绝对值 | 24° | 即时 | 动作太快，请慢一点 |
| eyes_closed | eyeBlinkLeft/Right 平均值 | 0.82 | 1000ms | 闭眼时间稍短，再试一次 |

## 兜底

- `camera_denied`：进入手动抽卡。
- `model_error`：保留动作模拟按钮和手动抽卡。
- `no_face`、`multi_face`、`low_light`、`off_center`：只提示调整，不输出判断。

