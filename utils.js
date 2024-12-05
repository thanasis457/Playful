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

let prevController = [
    new AbortController(),
    new AbortController(),
    new AbortController(),
    new AbortController(),
    new AbortController()
];
// let albumRetrieve;
// Returns the Album URL from the trackID
// Subscribe to up to five channels (0-4). Each channel maintains order consistency
function format_trackID(trackID, spot_instance, channel = 0) {
    if (store.get("source", "spotify") == "spotify") {
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
    } else if (store.get("source", "spotify") == "connect") {
        try {
            prevController[channel].abort();
            prevController[channel] = new AbortController();
            if (trackID.split(':').length < 3) {
                throw ("Incorrect TrackID");
            }
            return spot_instance
                .get(`tracks/${trackID.split(':')[2]}`, { signal: prevController[channel].signal })
                .then((res) => {
                    if (res.status !== 200) {
                        throw ("Spotify threw error");
                    }
                    // console.log("Fetched with Spotify API: ", res.data.album.images[0].url)
                    return res.data.album.images[0].url;
                })
                .catch((e) => {
                    if (axios.isCancel(e)) {
                        console.debug('Request canceled', e.message);
                    } else {
                        return getAlbumCoverArt();
                    }
                })
        } catch (e) {
            console.log("Format_trackID error:", e)
            return getAlbumCoverArt();
        }

        // Future Reference:
        // https://stackoverflow.com/questions/10123804/retrieve-cover-artwork-using-spotify-api
    }
}

module.exports.format_track = format_track;
module.exports.format_trackID = format_trackID;
