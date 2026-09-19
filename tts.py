"""Render every script line to an ElevenLabs clip for passive mode.

Reads script.js, writes clips/<hash>.mp3 (skipping ones already made)
and clips.js, which maps each line to its clip. The hash covers voice
and spoken text, so editing a line, recasting a part or restressing a
word renders a fresh clip.

Stress comes from CAPITALS, which the model reads as emphasis. The play
already capitalises its own ("You said it TWICE"); stress.json adds
more, mapping a line to how it should be spoken:

    {"NELSON: That's what I said.": "That's what \"I\" said."}

Quotation marks stress a word that capitals cannot, such as "I" or a
word already in capitals. The text on screen is never changed.

Needs ELEVEN_LABS_API_KEY in the environment.
"""
import base64, hashlib, json, os, pathlib, re, subprocess, urllib.request

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
MODEL = "eleven_v3"  # v3 follows capitals and punctuation for emphasis far better than v2
STRESS = json.loads(pathlib.Path("stress.json").read_text()) if os.path.exists("stress.json") else {}

script = json.loads(re.search(r"window\.SCRIPT = (.*);", pathlib.Path("script.js").read_text())[1])
clips = {}
pathlib.Path("clips").mkdir(exist_ok=True)


def spans(text, alignment):
    """When each sentence of a line starts and ends, so playback can loop one.

    Sentences come from sentences.js, the same splitter the app tests you with.
    """
    pieces = json.loads(subprocess.run(
        ["node", "-e", "const {sentences} = require('./sentences.js');"
                       "console.log(JSON.stringify(sentences(process.argv[1])))", "--", text],
        capture_output=True, text=True, check=True).stdout)
    starts, ends = alignment["character_start_times_seconds"], alignment["character_end_times_seconds"]
    out, at = [], 0
    for piece in pieces:
        first = text.index(piece, at)
        last = first + len(piece) - 1
        if last >= len(starts):
            break
        out.append([round(starts[first], 3), round(ends[last], 3)])
        at = last + 1
    return out
for line in script.split("\n"):
    if ":" not in line:
        continue  # scene break
    speaker, text = line.split(":", 1)
    voice = VOICES[speaker]  # KeyError on a new character: add a voice above.
    # A line cut off mid-word ends in a dash, which the voice reads as a strange
    # noise after a pause, so it is spoken without it.
    spoken = STRESS.get(line, text).strip().rstrip("—–-").strip()
    path = f"clips/{hashlib.sha1((MODEL + voice + spoken).encode()).hexdigest()[:16]}.mp3"
    timing = path.replace(".mp3", ".json")
    if not (os.path.exists(path) and os.path.exists(timing)):
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
            data=json.dumps({"text": spoken, "model_id": MODEL}).encode(),
            headers={"xi-api-key": KEY, "Content-Type": "application/json"})
        said = json.load(urllib.request.urlopen(req))
        pathlib.Path(path).write_bytes(base64.b64decode(said["audio_base64"]))
        pathlib.Path(timing).write_text(json.dumps(spans(spoken, said["alignment"])))
        print("rendered", line[:60])
    clips[line] = {"f": path, "s": json.loads(pathlib.Path(timing).read_text())}

pathlib.Path("clips.js").write_text(f"window.CLIPS = {json.dumps(clips, ensure_ascii=False)};\n")
print(f"{len(clips)} clips -> clips.js")
