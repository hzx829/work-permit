export function playEmergencyAlarm() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return () => {};

    const context = new AudioContextClass();
    const masterGain = context.createGain();
    const primary = context.createOscillator();
    const harmonic = context.createOscillator();
    const harmonicGain = context.createGain();
    const start = context.currentTime;
    const duration = 12;
    let stopped = false;

    primary.type = 'sawtooth';
    harmonic.type = 'triangle';
    harmonicGain.gain.value = 0.32;

    primary.connect(masterGain);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(masterGain);
    masterGain.connect(context.destination);

    masterGain.gain.setValueAtTime(0.0001, start);
    masterGain.gain.exponentialRampToValueAtTime(0.11, start + 0.12);

    // A slow, repeating rise and fall produces a long industrial warning siren.
    for (let offset = 0; offset < duration; offset += 1.5) {
        const peak = start + offset + 0.75;
        const end = start + offset + 1.5;
        primary.frequency.setValueAtTime(430, start + offset);
        primary.frequency.linearRampToValueAtTime(680, peak);
        primary.frequency.linearRampToValueAtTime(430, end);
        harmonic.frequency.setValueAtTime(645, start + offset);
        harmonic.frequency.linearRampToValueAtTime(1020, peak);
        harmonic.frequency.linearRampToValueAtTime(645, end);
    }

    masterGain.gain.setValueAtTime(0.11, start + duration - 0.35);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    primary.start(start);
    harmonic.start(start);
    primary.stop(start + duration + 0.05);
    harmonic.stop(start + duration + 0.05);

    const stop = () => {
        if (stopped) return;
        stopped = true;
        try { primary.stop(); } catch { /* oscillator already stopped */ }
        try { harmonic.stop(); } catch { /* oscillator already stopped */ }
        context.close().catch(() => {});
    };

    primary.addEventListener('ended', stop, { once: true });
    context.resume().catch(stop);
    return stop;
}
