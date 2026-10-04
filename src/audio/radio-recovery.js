const DEFAULT_RETRY_DELAYS = [1_000, 2_000, 4_000, 8_000, 15_000, 30_000, 60_000];
const STALL_GRACE_PERIOD = 12_000;

/** Reconnect a live radio after transport interruption without persisting stream data. */
export class RadioRecovery {
  constructor(media, onStatus = () => {}, options = {}) {
    this.media = media;
    this.onStatus = onStatus;
    this.retryDelays = options.retryDelays ?? DEFAULT_RETRY_DELAYS;
    this.stallGracePeriod = options.stallGracePeriod ?? STALL_GRACE_PERIOD;
    this.schedule = options.setTimeout ?? globalThis.setTimeout;
    this.cancel = options.clearTimeout ?? globalThis.clearTimeout;
    this.url = "";
    this.timer = null;
    this.attempt = 0;
    this.enabled = false;
    this.userPaused = false;
    this.retrying = false;

    this.onPlaying = () => {
      if (!this.enabled) return;
      this.clearTimer();
      this.attempt = 0;
      this.retrying = false;
      this.onStatus("live", 0);
    };
    this.onWaiting = () => {
      if (this.enabled && !this.userPaused) this.scheduleRetry(STALL_GRACE_PERIOD, "interrupted");
    };
    this.onFailure = () => {
      if (this.enabled && !this.userPaused) this.scheduleRetry();
    };
    media.addEventListener("playing", this.onPlaying);
    media.addEventListener("waiting", this.onWaiting);
    media.addEventListener("stalled", this.onWaiting);
    media.addEventListener("error", this.onFailure);
    media.addEventListener("ended", this.onFailure);
  }

  start(url) {
    this.stop();
    this.url = url;
    this.enabled = true;
    this.userPaused = false;
    this.onStatus("connecting", 0);
  }

  pause() {
    if (!this.enabled) return;
    this.userPaused = true;
    this.retrying = false;
    this.clearTimer();
    this.onStatus("paused", this.attempt);
  }

  resume() {
    if (!this.enabled) return;
    this.userPaused = false;
    this.clearTimer();
  }

  stop() {
    this.enabled = false;
    this.userPaused = false;
    this.retrying = false;
    this.url = "";
    this.attempt = 0;
    this.clearTimer();
  }

  destroy() {
    this.stop();
    this.media.removeEventListener("playing", this.onPlaying);
    this.media.removeEventListener("waiting", this.onWaiting);
    this.media.removeEventListener("stalled", this.onWaiting);
    this.media.removeEventListener("error", this.onFailure);
    this.media.removeEventListener("ended", this.onFailure);
  }

  clearTimer() {
    if (this.timer !== null) this.cancel(this.timer);
    this.timer = null;
  }

  scheduleRetry(delay, status = "retrying") {
    if (this.timer !== null || !this.enabled || this.userPaused) return;
    const nextAttempt = this.attempt + 1;
    const backoff = this.retryDelays[Math.min(this.attempt, this.retryDelays.length - 1)];
    this.onStatus(status, nextAttempt);
    this.timer = this.schedule(() => {
      this.timer = null;
      if (!this.enabled || this.userPaused || !this.url) return;
      this.attempt = nextAttempt;
      this.retrying = true;
      this.onStatus("retrying", this.attempt);
      try {
        this.media.src = this.url;
        this.media.load();
        Promise.resolve(this.media.play()).catch((error) => {
          this.retrying = false;
          if (error?.name === "NotAllowedError") {
            this.userPaused = true;
            this.onStatus("interaction-required", this.attempt);
            return;
          }
          this.scheduleRetry();
        });
      } catch {
        this.retrying = false;
        this.scheduleRetry();
      }
    }, delay ?? backoff);
  }
}
