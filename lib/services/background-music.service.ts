// background-music.service.ts
export class BackgroundMusicService {
  private static audio: HTMLAudioElement | null = null;

  static play(trackPath: string) {
    // If already playing, don't restart
    if (this.audio) return;

    const audio = new Audio(trackPath);
    audio.loop = true;
    audio.volume = 0.5;

    // Try to autoplay, fallback to user interaction
    audio.play().catch(() => {
      const start = () => {
        audio.play();
        window.removeEventListener("click", start);
      };
      window.addEventListener("click", start);
    });

    this.audio = audio;
  }

  static stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio = null;
  }
}
