# Cheatsheet

A list of most common functions with a small example.

## sample

Play a sound (see the sound database for names)

```js
new sample kick_909
```

## synth

Play a synth with a specified waveform (saw, sine, square, triangle)

```js 
new synth saw
```

## time

Set the timing (how many times is a sound played in a measure)

```js
// plays the hat_909 8 times per measure
new sample hat_909 time(1/8)

// plays the snare_909 2 times per measure
new sample snare_909 time(1/2)
```

## tempo

Change the tempo of all the sounds together. In BeatsPerMinute (BPM)

```js
set tempo 115

new sample bamboo_g time(1/3)
new sample bamboo_f time(1/4)
```

## play

Create a rhythm in a list for the sound to be played (or not). 1 = play, 0 = don't play

```js
list violinRhythm [1 0 0 1 0]

new sample violin_c time(1/8) play(violinRhythm)
```

## speed

Change the playbackrate (speed) of the `sample`, this changes the pitch because it is played slower

```js
// the choir_o is played 4 times slower 
new sample choir_o time(2) speed(0.25)
```

## note

Change the pitch of the `synth` and also change the octave (second argument), allowing to create melodies

```js 
list melody [0 3 7 3 9 3 0]
new synth triangle note(melody 2) time(1/16)
```

## fx

Add sound effects to the sample or synth like a reverb or distortion

```js 
// the harp sound has a distortion and reverb effect
new sample harp_down time(2) fx(reverb 0.5 2) fx(drive 40)
```

## rhythm lists

Create lists for rhythms with functions like flipping a coin, euclidean rhythm and more.

```js 
list tRhythm1 coin(8)
new sample tabla_hi time(1/16) play(tRhythm1)

list tRhythm2 euclidean(16 7)
new sample tabla_mid time(1/16) play(tRhythm2)
```

Try functions like: `coin()`, `euclidean()`, `hexBeat()`, `clave()`
