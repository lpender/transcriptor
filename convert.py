"""Convert Waiting Coen.pdf into script.js: one spoken line per step.

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

speeches = [repair(s) for s in speeches]

# A whole rant in one block is unreadable on screen, so long speeches become
# several blocks, split between sentences and each labelled with the speaker.
# (index.html splits those blocks into sentences again for learn mode.)
MAX = 220


def split_long(speech):
    if "***" not in speech and len(speech) > MAX:
        speaker, text = speech.split(":", 1)
        block = ""
        for sentence in re.findall(r"[^.!?…]+[.!?…]*\s*", text):
            if block and len(block) + len(sentence) > MAX:
                yield f"{speaker}:{block.rstrip()}"
                block = " "
            block += sentence
        yield f"{speaker}:{block.rstrip()}"
    else:
        yield speech


speeches = [block for s in speeches for block in split_long(s)]
open("script.js", "w").write("window.SCRIPT = " + json.dumps("\n".join(speeches), ensure_ascii=False) + ";\n")
print(f"{len(speeches)} speeches -> script.js")
