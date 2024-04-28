
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


function skipBack() {
  window.api.playPrevious();
  paused = false;
}
async function pausePlay() {
  if (!closed) {
    if(await window.api.togglePlay()){
      if (paused) {
        paused = false
      }
      else {
        paused = true
      }
    }
  }
}
function skipForward() {
  window.api.playNext();
  paused = false
}

var previous_timer = [0, 0]
var previous_result = [0, 0]

let prev_data = {
  "song": "",
  "artist": "",
  "album_cover": "",
  "pause": true,
};

setInterval(() => {
  window.api.getState().then((res) => {
    paused = !res;
  });
}, 3000)

setInterval(async () => {
  const {song, artist, cover} = await window["api"].getSong();
  if(song !== prev_data.song) {
    prev_data.song= song;
    song_title.innerText = song;
  }
  if(artist !== prev_data.artist) {
    prev_data.artist= artist;
    song_artist.innerText = artist;
  }
  album_cover = cover;
  
  if(album_cover != prev_data.album_cover) {
    prev_data.album_cover = album_cover;
    main.style.background = `url("${album_cover}")`
    var time = new Date().getTime()
    main.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
    setTimeout(() => {
      backup.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
    }, 500)
    preview.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
    setTimeout(() => {
      preview_backup.style.setProperty("background-image", `url('${album_cover}?v=` + time + "')", "important")
    }, 500)
  }

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
  if(paused != prev_data.pause) {
    prev_data.pause = paused;
    if (paused) {
      pause_play.style.backgroundImage = play
      pause_play.childNodes[0].childNodes[0].style.backgroundImage = play
    }
    else {
      pause_play.style.backgroundImage = pause
      pause_play.childNodes[0].childNodes[0].style.backgroundImage = pause
    }
  }
}, 1000)
