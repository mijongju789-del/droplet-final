const video = document.getElementById("leafVideo");
const leafWrap = document.querySelector(".leaf-wrap");
const grassUp = document.querySelector(".grass-up-layer");
const dropStage = document.querySelector(".drop-stage");
const dropFrames = [...document.querySelectorAll(".drop-frame")];

let duration = 0;
let targetTime = 0;
let rafId = 0;
let fadeStartAt = null;
const frameRate = 24;
const dropGrowDuration = 2100;
const dropStartScale = 0.18;
const dropStartOffsetY = -90;
const dropCycleScroll = 1560;
const hideVideoAtProgress = 0.92;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function getScrollProgress() {
  const rect = leafWrap.getBoundingClientRect();
  const viewportCenter = window.innerHeight / 2;
  const videoCenter = rect.top + rect.height / 2;
  const startLine = viewportCenter + window.innerHeight * 0.16;
  const endLine = viewportCenter - window.innerHeight * 0.22;

  return (startLine - videoCenter) / (startLine - endLine);
}

function setDropFrames(scrollProgress) {
  if (!dropFrames.length) return;

  const cycle = ((scrollProgress % 1) + 1) % 1;
  const scaled = cycle * dropFrames.length;
  const index = Math.floor(scaled) % dropFrames.length;
  const nextIndex = (index + 1) % dropFrames.length;
  const blend = scaled - Math.floor(scaled);

  dropFrames.forEach((frame, frameIndex) => {
    let opacity = 0;

    if (frameIndex === index) {
      opacity = 1 - blend;
    }

    if (frameIndex === nextIndex) {
      opacity = blend;
    }

    frame.style.opacity = opacity;
  });
}

function syncVideo() {
  if (duration) {
    const progress = getScrollProgress();
    const videoProgress = clamp(progress, 0, 1);

    targetTime = duration * videoProgress;
    const snappedTime = Math.round(targetTime * frameRate) / frameRate;

    if (Math.abs(video.currentTime - snappedTime) > 1 / frameRate / 2) {
      video.currentTime += (snappedTime - video.currentTime) * 0.08;
    }

    if (videoProgress < 1) {
      fadeStartAt = null;
    }

    if (videoProgress >= hideVideoAtProgress) {
      fadeStartAt ??= performance.now();
    }

    const showDrop = videoProgress >= hideVideoAtProgress;
    const dropGrowProgress = fadeStartAt
      ? clamp((performance.now() - fadeStartAt) / dropGrowDuration, 0, 1)
      : showDrop
        ? clamp((videoProgress - 0.96) / 0.04, 0, 1) * 0.08
        : 0;
    const dropScale =
      dropStartScale + (1 - dropStartScale) * dropGrowProgress;
    const dropOffsetY = dropStartOffsetY * (1 - dropGrowProgress);
    const cycleProgress = showDrop
      ? (window.scrollY - leafWrap.offsetTop) / dropCycleScroll
      : 0;

    leafWrap.style.opacity = fadeStartAt ? 0 : 1;
    grassUp.style.opacity = fadeStartAt ? 1 : 0;
    dropStage.style.opacity = showDrop ? 1 : 0;
    dropStage.style.transform = `translate(-50%, calc(-50% + ${dropOffsetY}px)) scale(${dropScale})`;
    setDropFrames(cycleProgress);
  }

  rafId = requestAnimationFrame(syncVideo);
}

function startScrollSync() {
  duration = video.duration || 0;
  video.pause();
  video.currentTime = 0;
  fadeStartAt = null;
  leafWrap.style.opacity = 1;
  grassUp.style.opacity = 0;
  dropStage.style.opacity = 0;
  dropStage.style.transform = `translate(-50%, calc(-50% + ${dropStartOffsetY}px)) scale(${dropStartScale})`;
  setDropFrames(0);

  if (!rafId) {
    syncVideo();
  }
}

video.addEventListener("loadedmetadata", startScrollSync, { once: true });

if (video.readyState >= 1) {
  startScrollSync();
}
