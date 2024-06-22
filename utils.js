const { store } = require("./main.js");
const axios = require("axios");
const { getAlbumCoverArt } = require("./mediaScripts.js");

function format_track(song, artist) {
    if (store.get("length", "short") == "long") {
        let song_edited = song;
        let artist_edited = artist;
        if (song.length + artist.length > 40) {
            if (artist.length > 16 && song.length > 24) {
                artist_edited = artist.substr(0, 14) + "..";
                song_edited = song.substr(0, 22) + "..";
            } else if (artist.length > 16) {
                artist_edited = artist.substr(0, 40 - song.length - 2) + "..";
            } else {
                song_edited = song.substr(0, 40 - artist.length - 2) + "..";
            }
        }
        if (artist_edited == "") {
            return song_edited;
        }
        return song_edited + " - " + artist_edited;
    } else {
        song_edited = song;
        artist_edited = artist;
        if (song.length + artist.length > 26) {
            if (artist.length > 10 && song.length > 16) {
                artist_edited = artist.substr(0, 8) + "..";
                song_edited = song.substr(0, 14) + "..";
            } else if (artist.length > 10) {
                artist_edited = artist.substr(0, 26 - song.length - 2) + "..";
            } else {
                song_edited = song.substr(0, 26 - artist.length - 2) + "..";
            }
        }
        if (artist_edited == "") {
            return song_edited;
        }
        return song_edited + " - " + artist_edited;
    }
}
let prevController = new AbortController();
// Returns the Album URL from the trackID
let albumRetrieve;
function format_trackID(trackID) {
    // Apple Script provides better quality
    // if (albumRetrieve){
    //     clearTimeout(albumRetrieve[0]);
    //     try{
    //         albumRetrieve[1]()
    //     } catch(e){
    //         console.log("err: ", e)
    //     }
    // };
    // return new Promise((resolve, reject) => {
    //     albumRetrieve = [setTimeout(() => {
    //         getAlbumCoverArt().then((response) => resolve(response))
    //     }, 500), reject];
    // });
    // setTimeout(getAlbumCoverArt, 500)
    
    return getAlbumCoverArt();
    
    try {
        prevController.abort();
    } catch { }
    // Found here: https://stackoverflow.com/questions/10123804/retrieve-cover-artwork-using-spotify-api
    const baseURL = "https://embed.spotify.com/oembed/?url=";
    const url = baseURL + trackID;
    console.log("Formatting: ", trackID)
    console.log("Getting response: ", url)
    prevController = new AbortController();

    // Performs some preformatting but allows handoff of .then .catch to caller
    return axios.get(url, { signal: prevController.signal })
        .then((response) => {
            return response.data.thumbnail_url;
        })
}

module.exports.format_track = format_track;
module.exports.format_trackID = format_trackID;
