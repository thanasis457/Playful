
// MediaController("result", (result) => {
//   var result = JSON.parse(result.replace(/'(?=(?:(?:[^"]*"){2})*[^"]*$)/g, "\""))
//   console.log(result)
// })


var song_title = document.getElementById("song-title")
var song_artist = document.getElementById("song-artist")
var pause_play = document.getElementById("pause-play")
var album_cover = "../media/album-cover.jpg"
var pause = `url("../media/pause.svg")`
var play = `url("../media/play.svg")`
var main = document.getElementById("main")
var backup = document.getElementById("backup")
var preview = document.getElementById("preview")
var preview_backup = document.getElementById("preview-backup")
var paused = false;
var closed = true
window.api.getState().then((res) => {
  console.log("Got: "+res);
  paused = !res;
});


function skipBack() {
  window.api.playPrevious();
  paused = false;
}
function pausePlay() {
  if (!closed) {
    window.api.togglePlay();
    if (paused) {
      paused = false
    }
    else {
      paused = true
    }
  }
}
function skipForward() {
  window.api.playNext();
  paused = false
}

var previous_timer = [0, 0]
var previous_result = [0, 0]

setInterval(async () => {
  try {
  const [song, artist] = await window["api"].getSong();
  var result = {
    "album_artist": "",
    "album_title": "",
    "album_track_count": 0,
    "artist": artist,
    "genres": [],
    "playback_type": 1,
    "subtitle": "",
    "title": song,
    "track_number": 0,
    "timeline_position": "21",
    "timeline_duration": "30",
    "playing": 1
  };
  }
  catch {
    var result = {"playing": 0}
  }
  if (result.playing == 1) {
    var closed = false
  }
  else {
    var closed = true
  }
  if (result.timeline_position != "") {
    var minutes = Math.floor(parseInt(result.timeline_position) / 60)
    var seconds = Math.floor(parseInt(result.timeline_position) - minutes * 60)
    if (previous_result.toString() == [seconds, minutes].toString() && !paused && !closed) {
      seconds = previous_timer[0]
      minutes = previous_timer[1]
      seconds == 59 ? (minutes += 1, seconds = 0) : seconds += 1
      song_title.innerText = `past: ${previous_timer[0]} now: ${seconds}`
    }
    else {
      previous_result = [seconds, minutes]
    }
    previous_timer = [seconds, minutes]
    seconds = seconds.toString()
    parseInt(seconds) < 10 ? seconds = "0" + seconds : null
    minutes = minutes.toString()
  }
  else {
    seconds = "00"
    minutes = "0"
  }
  song_title.innerText = result.title;
  song_artist.innerText = result.artist;
  main.style.background = `url("${album_cover}")`
  if (song_title.innerText.length >= 16) {
    song_title.style.animation = `loop-scroll ${song_title.innerText.length/2}s linear infinite`
  }
  else {
    song_title.style.animation = "none"
  }
  if (song_artist.innerText.length >= 16) {
    song_artist.style.animation = `loop-scroll ${song_artist.innerText.length/2}s linear infinite`
    song_artist.style.right = "auto"
    song_artist.style.left = "0"
  }
  else {
    song_artist.style.animation = "none"
    song_artist.style.right = "0"
    song_artist.style.left = "auto"
  }
  if (paused) {
    pause_play.style.backgroundImage = play
    pause_play.childNodes[0].childNodes[0].style.backgroundImage = play
  }
  else {
    pause_play.style.backgroundImage = pause
    pause_play.childNodes[0].childNodes[0].style.backgroundImage = pause
  }
  var time = new Date().getTime()
  main.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
  setTimeout(() => {
    backup.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
  }, 500)
  preview.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
  setTimeout(() => {
    preview_backup.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
  }, 500)
}, 1000)
