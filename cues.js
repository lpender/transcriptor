// The show's sound design, by James, scene by scene. Each scene has a bed of room
// tone that loops under the dialogue, and most a piece of music that grows out of
// that tone and plays once over it. Music and bed are switched on their own.
//
// A cue with `hold` is a stop of its own, with no lines: the app puts it in the
// script column where it falls in this order, so you press through it like a
// line. One with no music and no bed is a silence. The others attach to the
// script's scenes ("***" breaks) in order.
//
// Alternatives James offered are noted; swap the file names to try them.
window.CUES = [
  { name: 'Before the show', music: 'WaitingIntro.mp3', bed: 'QuietRoom.mp3', hold: true },
  { name: 'Reception', music: 'OfficeFansCelli.mp3', bed: 'OfficeFans.mp3' },
  { name: 'Pause', music: 'OfficeFansCelli.mp3', hold: true },  // Reception's music again, alone, before the meeting
  { name: 'First meeting', music: 'HorridToneLowSynth.mp3', bed: 'HorridTone.mp3' },
  { name: 'Pause', music: 'BustedFanTortureTrills.mp3', hold: true },  // after "Eight thousand and twenty-two years.": the next scene's music, ahead of it
  { name: 'Nelson chews out the receptionist', bed: 'BustedFanTorture.mp3' },  // James: "not sure about this one"; its trills play in the pause before
  { name: 'Second meeting, McMartin', music: 'StrangeHumDeepNote.mp3', bed: 'StrangeHum.mp3' },
  { name: 'Silent reception', music: 'SadDay.mp3', bed: 'NoDialogueRoom.mp3', hold: true },  // or no music, just the room
  { name: 'Third meeting, Polhemus', music: 'FactoryHellTremolo.mp3', bed: 'FactoryHell.mp3' },  // or StrangeHum.mp3 / Ventilation.mp3
  { name: 'Nelson sings', bed: 'Ventilation.mp3' },  // James left this one open; AwfulComputerTone.mp3 is spare
  { name: 'Disclosure', music: 'ComputerFanFaintBeepStrings.mp3', bed: 'ComputerFanFaintBeep.mp3' },  // or Furnace.mp3
  { name: 'The end', music: 'WaitingOutro.mp3', hold: true },  // ends abruptly, on purpose; SadDay.mp3 was tried here
];
