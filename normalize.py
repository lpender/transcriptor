"""Bring every room tone in sound/ to the same loudness, so one slider fits all.

James mixed the beds thirty decibels apart. Each is shifted by a flat gain to a
mean of TARGET dB (no compression, no limiting), re-encoded at its own bitrate.
The music is left alone: its levels are part of the composition. Run after James
sends new files:   python3 normalize.py
"""
import re, subprocess, sys

TARGET = -28.0  # dB mean; leaves 8 dB of headroom on the loudest bed
BEDS = ["OfficeFans", "HorridTone", "BustedFanTorture", "StrangeHum", "NoDialogueRoom",
        "FactoryHell", "Ventilation", "ComputerFanFaintBeep", "QuietRoom", "AwfulComputerTone", "Furnace"]


def levels(path):
    out = subprocess.run(["ffmpeg", "-i", path, "-af", "volumedetect", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return tuple(float(re.search(rf"{k}_volume: ([-\d.]+) dB", out)[1]) for k in ("mean", "max"))


for name in BEDS:
    path = f"sound/{name}.mp3"
    mean, peak = levels(path)
    gain = TARGET - mean
    if abs(gain) < 0.5:
        print(f"{name:24} {mean:6.1f} dB  ok"); continue
    if peak + gain > -1:
        sys.exit(f"{name}: +{gain:.1f} dB would clip (peak {peak:.1f} dB); lower TARGET")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", path, "-af", f"volume={gain:.2f}dB",
                    "-codec:a", "libmp3lame", "-b:a", "160k", "-id3v2_version", "3", "tmp.mp3"], check=True)
    subprocess.run(["mv", "tmp.mp3", path], check=True)
    print(f"{name:24} {mean:6.1f} dB  {gain:+.1f} dB -> {levels(path)[0]:.1f}")
