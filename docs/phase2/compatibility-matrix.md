# 兼容性矩阵

| 目标环境 | 验收目标 | 当前状态 | 备注 |
|---|---|---|---|
| Desktop Chrome | 页面加载、无控制台错误、手动抽卡、动作模拟、构建通过 | 自动化覆盖 | 真实摄像头需人工确认权限弹窗 |
| Android Chrome | 摄像头授权、端侧模型加载、低端机降帧记录 | 待人工 QA | 目标单帧尽量 < 50ms，必要时降低检测频率 |
| iOS Safari | 摄像头授权、手动抽卡兜底、UI 不阻塞 | 待人工 QA | MediaPipe CDN/wasm 加载需现场网络验证 |

## QA 记录字段

- 设备、浏览器、系统版本。
- 模型加载是否成功。
- 平均帧耗时和主观卡顿。
- blink、smile、brow_up、mouth_open、head_turn、eyes_closed、look_stable 是否成功。
- 失败原因：no_face、multi_face、low_light、off_center、model_error、camera_denied。

