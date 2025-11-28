// background-music.service.ts
export class BackgroundMusicService {
  private static audio: HTMLAudioElement | null = null;
  private static fadeInterval: number | null = null;

  // ========= PLAY (with FADE-IN) =========
  static play(trackPath: string, fadeInMs: number = 1000) {
    // If already playing a different track → stop & replace
    if (this.audio && !this.audio.src.includes(trackPath)) {
      this.stop(); 
    }
    // If same track already playing → ignore
    if (this.audio) return; 

    const audio = new Audio(trackPath);
    audio.loop = true;
    audio.volume = 0; // start muted for fade-in

    audio.play().catch(() => {
      const start = () => {
        audio.play();
        window.removeEventListener("click", start);
      };
      window.addEventListener("click", start);
    });

    this.audio = audio;
    this.fadeIn(fadeInMs);
  }

  // ========= PAUSE / RESUME =========
  static pause() {
    this.audio?.pause();
  }

  static resume() {
    this.audio?.play();
  }

  // ========= FADE-IN =========
  private static fadeIn(duration = 1000) {
    if (!this.audio) return;

    const target = 0.5;               // final volume
    const steps = 30;
    const step = target / steps;
    const interval = duration / steps;

    this.clearFade();
    this.fadeInterval = window.setInterval(() => {
      if (!this.audio) return;
      this.audio.volume = Math.min(target, this.audio.volume + step);
      if (this.audio.volume >= target) this.clearFade();
    }, interval);
  }

  // ========= FADE-OUT + STOP =========
  static fadeOut(duration = 1000) {
    if (!this.audio) return;

    const steps = 30;
    const step = this.audio.volume / steps;
    const interval = duration / steps;

    this.clearFade();
    this.fadeInterval = window.setInterval(() => {
      if (!this.audio) return;
      this.audio.volume = Math.max(0, this.audio.volume - step);
      if (this.audio.volume <= 0) {
        this.clearFade();
        this.stop();
      }
    }, interval);
  }

  // ========= FULL STOP =========
  static stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio = null;
  }

  private static clearFade() {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }
  }
}
