"""Bring the room tones in sound/ to one loudness and the music to another, so
one slider fits each.

James mixed them up to thirty decibels apart. Each file is shifted by a flat
gain to its group's mean (no compression, no limiting) and re-encoded at its own
bitrate. Run after James sends new files:   python3 normalize.py
"""
import re, subprocess, sys

# dB mean per group. The music sits 5 dB above the beds; the room slider starts
# lower still. Both leave 5 dB of headroom on the loudest file.
GROUPS = {
    -28.0: ["OfficeFans", "HorridTone", "BustedFanTorture", "StrangeHum", "NoDialogueRoom",
            "FactoryHell", "Ventilation", "ComputerFanFaintBeep", "QuietRoom", "AwfulComputerTone", "Furnace"],
    -23.0: ["WaitingIntro", "OfficeFansCelli", "HorridToneLowSynth", "BustedFanTortureTrills", "StrangeHumDeepNote",
            "SadDay", "FactoryHellTremolo", "ComputerFanFaintBeepStrings", "WaitingOutro"],
}


def levels(path):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return tuple(float(re.search(rf"{k}_volume: ([-\d.]+) dB", out)[1]) for k in ("mean", "max"))


for target, name in ((t, n) for t, names in GROUPS.items() for n in names):
    path = f"sound/{name}.mp3"
    mean, peak = levels(path)
    gain = target - mean
    if abs(gain) < 1:  # a re-encode drifts half a dB; do not chase it
        print(f"{name:24} {mean:6.1f} dB  ok"); continue
    if peak + gain > -1:
        sys.exit(f"{name}: +{gain:.1f} dB would clip (peak {peak:.1f} dB); lower its target")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-af", f"volume={gain:.2f}dB",
                    "-codec:a", "libmp3lame", "-b:a", "160k", "-id3v2_version", "3", "tmp.mp3"], check=True)
    subprocess.run(["mv", "tmp.mp3", path], check=True)
    print(f"{name:24} {mean:6.1f} dB  {gain:+.1f} dB -> {levels(path)[0]:.1f}")
