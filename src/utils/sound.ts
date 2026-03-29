export const playQuack = () => {
  const ctx = new AudioContext();

  const makeQuack = (startTime: number, pitchScale = 1.0) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';

    osc.frequency.setValueAtTime(380 * pitchScale, startTime);
    osc.frequency.linearRampToValueAtTime(620 * pitchScale, startTime + 0.04);
    osc.frequency.exponentialRampToValueAtTime(220 * pitchScale, startTime + 0.22);

    filter.type = 'bandpass';
    filter.frequency.value = 800 * pitchScale;
    filter.Q.value = 3;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.35, startTime + 0.025);
    gain.gain.setValueAtTime(0.35, startTime + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.28);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.28);
  };

  const t = ctx.currentTime;
  makeQuack(t, 1.0);
  makeQuack(t + 0.32, 0.85);

  setTimeout(() => ctx.close(), 1200);
};
