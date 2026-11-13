import { HandInput } from './hand-input.js';

const asset = name => new URL('../vendor/mediapipe/' + name, import.meta.url).href;
const links = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[17,0]];

async function createDetector() {
  const { FilesetResolver, HandLandmarker } = await import(asset('vision_bundle.mjs'));
  const vision = await FilesetResolver.forVisionTasks(asset('wasm'));
  return HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: asset('hand_landmarker.task'), delegate: 'CPU' },
    runningMode: 'VIDEO', numHands: 1,
    minHandDetectionConfidence: 0.55, minTrackingConfidence: 0.55,
  });
}

export function installHandCamera({ button, onHand }) {
  const panel = document.createElement('aside');
  panel.className = 'hand-camera';
  panel.hidden = true;
  panel.setAttribute('aria-label', '前置摄像头');
  panel.innerHTML = `
    <div class="hand-camera-head"><span><i aria-hidden="true"></i> 镜像预览</span><button type="button" aria-label="关闭摄像头">×</button></div>
    <div class="hand-camera-view"><video autoplay muted playsinline aria-label="你的实时摄像头画面"></video><canvas aria-hidden="true"></canvas></div>
    <div class="hand-camera-help">食指移动搅水 · 捏合投香</div>`;
  const notice = document.createElement('div');
  notice.className = 'hand-camera-notice';
  notice.setAttribute('role', 'status');
  notice.hidden = true;
  document.body.append(panel, notice);
  const video = panel.querySelector('video');
  const overlay = panel.querySelector('canvas');
  const preview = panel.querySelector('.hand-camera-view');
  const help = panel.querySelector('.hand-camera-help');
  const close = panel.querySelector('button');
  const ctx = overlay.getContext('2d');
  const input = new HandInput();
  let stream, detector, frame = 0, generation = 0, lastFrame = -1, lastTick = -Infinity;
  let mode = 'idle', noticeTimer;

  function showNotice(message) {
    clearTimeout(noticeTimer);
    notice.textContent = message;
    notice.hidden = !message;
    if (message) noticeTimer = setTimeout(() => { notice.hidden = true; }, 7500);
  }

  function status(message) {
    if (help.textContent !== message) help.textContent = message;
  }

  function setMode(value) {
    mode = value;
    const active = value !== 'idle';
    panel.hidden = !active;
    document.body.classList.toggle('hand-camera-active', active);
    panel.classList.toggle('live', value === 'live');
    button.setAttribute('aria-expanded', String(active));
    button.setAttribute('aria-label', active ? '关闭手势摄像头' : '开启手势摄像头');
    button.title = active ? '关闭手势摄像头' : '开启手势摄像头';
  }

  function stop(message = '') {
    generation++;
    cancelAnimationFrame(frame);
    stream?.getTracks().forEach(track => track.stop());
    stream = undefined;
    video.pause();
    video.srcObject = null;
    detector?.close();
    detector = undefined;
    input.reset();
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    onHand(null);
    setMode('idle');
    showNotice(message);
  }

  function draw(points, pinch) {
    const w = video.videoWidth, h = video.videoHeight;
    if (overlay.width !== w || overlay.height !== h) {
      overlay.width = w; overlay.height = h;
      preview.style.setProperty('--feed-aspect', (w / h).toFixed(4));
    }
    ctx.clearRect(0, 0, w, h);
    if (!points) return;
    ctx.strokeStyle = pinch ? '#ffcb8b' : '#99ffe0';
    ctx.lineWidth = Math.max(w, h) / 250;
    ctx.beginPath();
    for (const [a, b] of links) {
      ctx.moveTo(points[a].x * w, points[a].y * h);
      ctx.lineTo(points[b].x * w, points[b].y * h);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(points[8].x * w, points[8].y * h, Math.max(w, h) / 70, 0, Math.PI * 2);
    ctx.stroke();
  }

  function tick(now) {
    if (mode !== 'live') return;
    frame = requestAnimationFrame(tick);
    if (video.readyState < 2 || video.currentTime === lastFrame || now - lastTick < 40) return;
    lastTick = now;
    lastFrame = video.currentTime;
    try {
      const points = detector.detectForVideo(video, now).landmarks[0];
      const hand = input.update(points, now, video.videoWidth / video.videoHeight);
      draw(points, hand?.closed);
      onHand(hand);
      status(hand ? (hand.closed ? '已捏合 · 松手可再投' : '食指移动搅水 · 捏合投香') : '把一只手举到镜头前');
    } catch (err) {
      console.warn('Hand tracking stopped:', err);
      stop('手势识别已停止，可以重试或继续用触屏。');
    }
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showNotice('此浏览器无法使用摄像头，请在系统浏览器中打开页面。');
      return;
    }
    const run = ++generation;
    let opened = false;
    showNotice('');
    setMode('loading');
    status('等待摄像头授权…');
    try {
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: { ideal: 'user' }, width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30 } },
      });
      if (run !== generation) { localStream.getTracks().forEach(t => t.stop()); return; }
      stream = localStream;
      opened = true;
      for (const track of stream.getVideoTracks()) track.addEventListener('ended', () => {
        if (run === generation) stop('摄像头已断开，可以重新开启。');
      });
      video.srcObject = stream;
      await video.play();
      if (run !== generation) return;
      panel.classList.add('live');
      status('正在加载手势识别…');
      const localDetector = await createDetector();
      if (run !== generation) { localDetector.close(); return; }
      detector = localDetector;
      input.reset();
      lastFrame = -1;
      lastTick = -Infinity;
      setMode('live');
      status('把一只手举到镜头前');
      frame = requestAnimationFrame(tick);
    } catch (err) {
      if (run !== generation) return;
      const message = !opened && err.name === 'NotAllowedError'
        ? '未获得摄像头权限。请在浏览器中允许摄像头后重试。'
        : !opened && err.name === 'NotFoundError'
          ? '未找到摄像头。连接摄像头后可以重试。'
          : opened ? '手势识别未能加载，请刷新后重试。' : '摄像头未能开启，请检查是否被其他应用占用。';
      stop(message);
    }
  }

  button.addEventListener('click', () => mode === 'idle' ? start() : stop());
  close.addEventListener('click', () => { stop(); button.focus(); });
  addEventListener('pagehide', () => stop());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && mode !== 'idle') stop();
  });
}
