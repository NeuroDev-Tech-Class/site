# Project: Music Player Web App

## Description

This project will be completed in **two stages** to gradually build a full-featured web-based music player.  
In the **first part**, you’ll create an app that plays a **single track**, complete with controls for playback, volume, and elapsed time.  
In the **second part**, you’ll expand the app to include a **playlist** of multiple songs with functionality to navigate, select, and automatically advance between tracks.

This project will strengthen your understanding of:
- DOM manipulation  
- Event listeners  
- Functions and state management  
- Object properties and methods  
- Timers (`setInterval`)  
- Arrays and simple data structures  

Refer to example UIs for inspiration, but design your own unique and creative interface.

---

## Part 1: Single Track Music Player

### Requirements

Design and implement a user interface that includes the following input and output elements:

- **Static display elements** that show the **title** and **artist** of the current song.  
- A **display element** that shows **elapsed time** in minutes and seconds as the song plays.  
- A **play/pause button** that toggles its function and visual state depending on playback.  
- A **stop button** that stops playback and resets the track to the start.  
- **Volume up/down buttons** that each increase or decrease the audio volume level.  
- A **display element** showing the current **volume level**, either numerically or symbolically.

### Implementation Details

- Use at least one **external typeface** and a **modern icon set** for your UI.  
- Implement audio playback using the **`HTMLAudioElement`** object and its methods, properties, and events.  
- Construct the audio object using a **local audio file** (e.g., `.mp3`, `.m4a`).  
- Control playback using the `play()` and `pause()` methods.  
- Examine and modify playback state using properties like `currentTime`, `paused`, and `volume`.  
- Respond to audio events such as `play` and `pause`.  
- Continuously update the elapsed time using `setInterval()`.  
- Write **separate functions** for handling logic and updating the UI.

### Optional Enhancements

- Add a **playback scrubber** that displays progress as the song plays.  
- Allow users to **click the scrubber** to seek to a specific playback position.  
- Create a more **visually refined UI** for an enhanced user experience.  

---

## Part 2: Multi-Track Playlist Player

### Requirements

Expand your existing music player to include **playlist functionality** that allows the user to manage and play multiple songs.

#### UI Additions

- A **playlist** showing each track’s **number**, **title**, and **artist**.  
- A **next button** that plays the next track (loops back to the start if needed).  
- A **previous button** that plays the previous track (loops to the end if needed).  

#### Logic and Functionality

- When a user clicks a track in the playlist, switch to and play that track.  
- When a track finishes, automatically **advance to the next** track in the playlist.  
- When a new track starts:  
  - Reset and display elapsed time starting at **00:00**.  
  - Update the **song title** and **artist** display.  
  - **Highlight** the currently playing track in the playlist.  

#### Technical Details

- Continue using the same **typeface** and **icon set** for a cohesive design.  
- Use the `HTMLAudioElement` object for playback, and utilize its `src`, `volume`, and `ended` event.  
- Represent the playlist using an **array of JavaScript objects**, each containing attributes like title, artist, and file path.  
- Track the current song using a **current index variable**.  
- Include at least **five songs** in your playlist (more is encouraged).  
- Create **additional functions** as needed to handle new logic and UI updates.

### Optional Enhancements

- Implement a **scrubber** to show and control playback progress.  
- Allow **click-to-seek** functionality for the scrubber.  
- Design a more **visually engaging interface** for the player.