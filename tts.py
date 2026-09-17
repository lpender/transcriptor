"""Render every script line to an ElevenLabs clip for passive mode.

Reads script.js, writes clips/<hash>.mp3 (skipping ones already made)
and clips.js, which maps each line to its clip. The hash covers voice
and text, so editing a line or recasting a part renders a fresh clip.
Needs ELEVEN_LABS_API_KEY in the environment.
"""
import hashlib, json, os, pathlib, re, urllib.request

# ElevenLabs premade voices. MAN is Sebatacheck before he introduces himself.
VOICES = {
    "NELSON": "iP95p4xoKVk53GoZ742B",        # Chris - charming, down-to-earth
    "RECEPTIONIST": "Xb7hH8MSUJpSbSDYk0k2",  # Alice - clear, British
    "SEBATACHECK": "cjVigY5qzO86Huf0OWal",   # Eric - smooth, trustworthy
    "MAN": "cjVigY5qzO86Huf0OWal",
    "MCMARTIN": "pqHfZKP75CvOlQylNhV4",      # Bill - wise, old
    "POLHEMUS": "pNInz6obpgDQGcFmaJgB",      # Adam - dominant, firm
}
KEY = os.environ["ELEVEN_LABS_API_KEY"]

script = json.loads(re.search(r"window\.SCRIPT = (.*);", pathlib.Path("script.js").read_text())[1])
clips = {}
pathlib.Path("clips").mkdir(exist_ok=True)
for line in script.split("\n"):
    speaker, text = line.split(":", 1)
    voice = VOICES[speaker]  # KeyError on a new character: add a voice above.
    path = f"clips/{hashlib.sha1((voice + text).encode()).hexdigest()[:16]}.mp3"
    if not os.path.exists(path):
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}?output_format=mp3_44100_128",
            data=json.dumps({"text": text.strip(), "model_id": "eleven_multilingual_v2"}).encode(),
            headers={"xi-api-key": KEY, "Content-Type": "application/json"})
        pathlib.Path(path).write_bytes(urllib.request.urlopen(req).read())
        print("rendered", line[:60])
    clips[line] = path

pathlib.Path("clips.js").write_text(f"window.CLIPS = {json.dumps(clips, ensure_ascii=False)};\n")
print(f"{len(clips)} clips -> clips.js")
