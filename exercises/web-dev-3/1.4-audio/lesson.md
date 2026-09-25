# Audio in Web Development

## Audio Object

In JavaScript, audio from the Web App is controlled by the **Audio** object. You create it like so:

```javascript
let audio = new Audio();
```

## Audio Methods

**Source**

For the audio object, you need to have an MP3 file (Other audiofiles can work, but use MP3s for this lesson). This method establishes where your MP3 file is located in your file tree. Best practice is to have a folder where all your audio files are located. You will generally 

```javascript
audio.src = "mp3s/myFunAudio.mp3";
```

**Play**:

This starts the music. Whatever source you set your audio object to will play regardless.

```javascript
audio.play();
```

**Pause**

This pauses the music. You can also check the current status of whether or not the audio is paused. 

```javascript
audio.pause(); // Pauses music

audio.paused() // Returns a boolean for current paused status
```

**Volume**

You can set the audio volume to any number between 0.0 and 1.0. This represents a volume percentage from 0% to 100% music volume.

```javascript
audio.volume = 0.5; // Sets volume to 50%
```

**Current Time**

This method allows you to both check what the current song play time is, and set it. This is good for when you want to restart a song, or if you want to keep track of what the current song time is (common to every music app). The value of this method will be represented in miliseconds. At the end of the lesson I will show you a method to actively update the DOM so you can have the current song time actively tick up in real time.

```javascript
audio.currentTime = 0; // Sets the current song to the beginning

// Assuming you have an HTML element to display the current time
let currentPlayTime = document.querySelector("#currentPlayTime");
currentPlayTime.textContent = audio.currentTime;
```

**Ended**

This method is activated when the song reaches its finishing point. This is useful for repeating a song, or moving on to a new song when the previous on finished. This is a property used in an Event Listener in the first argument

```javascript
audio.addEventListener("ended", function () {
    audio.currentTime = 0;
    audio.play();  
}) // Restarts the song
```

## Interval Time Checks

For many things on the DOm there may be a real time aspect to them (like the current time of a playing song). There is a way to update after a set interval of time using the **setInterval()** method. The first argument is a function stating what you want to do every certain amount of time, and the second argument is the interval of time in miliseconds.

```javascript
setInterval(function () {
  currentTime.textContent = audio.currentTime / 1000; // Displays the current time in seconds 
}, 100); // Updates every 100 miliseconds (0.1 seconds)
```

## Key Takeaways

- The Audio object is used to control audio in web development.
- Important methods include `src`, `play()`, `pause()`, `volume`, `currentTime`, and `ended`.
- You can use `setInterval()` to update elements in real time, such as displaying the current play time of an audio track.
- Event listeners can be used to trigger actions when the audio ends.