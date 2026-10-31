let audio: AudioContext | null = null;
export function squeak(enabled: boolean, crash = false) {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    void audio.resume().catch(() => {});
    const oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = crash ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(crash ? 240 : 880, audio.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(
      crash ? 70 : 1300,
      audio.currentTime + 0.1,
    );
    gain.gain.setValueAtTime(0.07, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + 0.18);
  } catch {
    /* Audio is optional, including browsers that block audio contexts. */
  }
}
