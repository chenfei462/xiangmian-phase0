export function hasCameraSupport(): boolean {
  return Boolean(navigator.mediaDevices?.getUserMedia);
}

export async function requestCameraStream(): Promise<MediaStream> {
  if (!hasCameraSupport()) {
    throw new Error("当前浏览器不支持摄像头授权。");
  }

  return navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  });
}

export function stopCameraStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}
