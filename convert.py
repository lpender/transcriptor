"""Convert Waiting Coen.pdf into script.js: one sentence per step.

Each PDF page is a two-page landscape spread, so each half is extracted
separately to keep reading order. Speeches start at column 0 as
"NAME: text"; wrapped speech lines are indented a little, stage
directions a lot. The PDF's font drops the fi/fl/ffi ligatures and maps
"f" to a form feed, so those words are repaired from a table.
"""
import json, re, subprocess, sys

PDF = sys.argv[1] if len(sys.argv) > 1 else "Waiting Coen.pdf"
# The PDF's font drops fi/fl/ffi/ff glyphs entirely. Found by checking
# every non-dictionary word in the dialogue; re-check if the PDF changes.
DROPPED_LIGATURES = {"rst": "first", "fty": "fifty", "ve hundred": "five hundred",
                     "e ective": "effective", "a davit": "affidavit", "ne": "fine"}


def pages():
    pages = int(re.search(r"Pages:\s+(\d+)", subprocess.run(["pdfinfo", PDF], capture_output=True, text=True).stdout)[1])
    for p in range(1, pages + 1):
        for x in (0, 396):
            yield subprocess.run(["pdftotext", "-layout", "-f", str(p), "-l", str(p), "-x", str(x), "-y", "0",
                                  "-W", "396", "-H", "612", PDF, "-"], capture_output=True, text=True, check=True).stdout


def repair(text):
    for broken, word in DROPPED_LIGATURES.items():
        text = re.sub(rf"\b{broken}\b", word, text)
    return text


speeches = []
for half in pages():
    for line in half.rstrip("\f").replace("\f", "f").splitlines():
        indent = len(line) - len(line.lstrip())
        if "***" in line:
            if speeches and speeches[-1] != "***":  # a break can appear on both page halves
                speeches.append("***")  # scene break; index.html draws a divider
        elif re.match(r"[A-Z]+:", line):
            speeches.append(line.strip())
        elif line.strip() and indent <= 4 and speeches and speeches[-1] != "***" and not line.strip().isupper():
            if not re.match(r"[A-Z]", line.strip()) or indent > 0:
                speeches[-1] += ("" if speeches[-1].endswith("-") else " ") + line.strip()

speeches = [re.sub(r"\s{2,}", " ", repair(s)) for s in speeches]  # the PDF pads spaced-out text


def pieces(speech):
    """A speech as one block per sentence, each labelled with the speaker.

    A monologue you step through a screenful at a time is useless, and the split
    is sentences.js — the same one the app tests you with and tts.py times.
    """
    if speech == "***":
        return [speech]
    speaker, text = speech.split(":", 1)
    out = subprocess.run(
        ["node", "-e", "const {blocks} = require('./sentences.js');"
                       "console.log(JSON.stringify(blocks(process.argv[1])))", "--", text.strip()],
        capture_output=True, text=True, check=True).stdout
    return [f"{speaker}: {piece}" for piece in json.loads(out)] or [speech]


speeches = [piece for speech in speeches for piece in pieces(speech)]

open("script.js", "w").write("window.SCRIPT = " + json.dumps("\n".join(speeches), ensure_ascii=False) + ";\n")
print(f"{len(speeches)} speeches -> script.js")
