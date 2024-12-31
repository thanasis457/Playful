const { store } = require("./main.js");
const axios = require("axios");
const { getAlbumCoverArt } = require("./mediaScripts.js");
const { net } = require('electron');

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

// Returns the Album URL from the trackID
// Subscribe to up to five channels (0-4). Each channel maintains order consistency
function format_trackID(trackID, spot_instance, channel = 0) {
    if (!net.isOnline()) {
        return getAlbumCoverArt();
    } else {
        try {
            prevController[channel].abort();
            prevController[channel] = new AbortController();
            if (trackID.split(':').length < 3) {
                throw ("Incorrect TrackID");
            }
            return axios
                .get(`https://embed.spotify.com/oembed?url=${trackID}`, { signal: prevController[channel].signal })
                .then((res) => {
                    if (res.status !== 200) {
                        throw ("URL threw error");
                    }
                    // Upscale resolution by changing the cdn's url
                    const regex = /(https:\/\/.+\.spotifycdn.com\/image\/.{12})1e02(.+)/gm;
                    const f = res.data.thumbnail_url.replace(regex, '$1b273$2');
                    // console.log("Fetched with Smart Lookup: ", f, trackID);
                    return f;
                })
                .catch((e) => {
                    if (axios.isCancel(e)) {
                        console.debug('Request canceled', e.message);
                    } else {
                        console.debug(e);
                        return getAlbumCoverArt();
                    }
                })
        } catch (e) {
            console.log("Format_trackID error:", e)
            return getAlbumCoverArt();
        }

        // Reference:
        // https://stackoverflow.com/questions/10123804/retrieve-cover-artwork-using-spotify-api
    }
}

module.exports.format_track = format_track;
module.exports.format_trackID = format_trackID;
