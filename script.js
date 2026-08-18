let player = new Audio();
let currentSongIndex = -1;

const songs = [];

async function loadSongs() {
    try {
        const response = await fetch('songslinks.txt');
        const text = await response.text();
        const urls = text.split('\n').filter(line => line.trim() !== '');
        
        const tempSongs = [];
        for (const url of urls) {
            // Check if it's a KoshalWorld download link
            if (url.includes('koshalworld.com/download/')) {
                const parts = url.split('/');
                const id = parts[parts.length - 2];
                const rawTitle = parts[parts.length - 1].replace('.html', '');
                
                // Format title (e.g. suno-kaho -> Suno Kaho)
                const title = rawTitle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                
                tempSongs.push({
                    title: title,
                    file: `https://koshalworld.com/files/download/type/320/id/${id}`
                });
            } else if (url.includes('koshalworld.com/files/download/')) {
                // If they pasted the direct link directly
                tempSongs.push({
                    title: "Unknown Song",
                    file: url.trim()
                });
            }
        }
        
        // Filter out exact duplicates
        const seen = new Set();
        for (const song of tempSongs) {
            if (!seen.has(song.file)) {
                seen.add(song.file);
                songs.push(song);
            }
        }
        
        updateStatus("Playlist loaded. Ready to play.");
    } catch (e) {
        updateStatus("Error loading songs from text file.");
        console.error(e);
    }
}

// Load songs on startup
loadSongs();

let progressInterval;

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}

function updateProgress() {
    if (!player.paused || player.currentTime > 0) {
        const currentTime = player.currentTime;
        const duration = player.duration;
        
        if (currentSongIndex !== -1) {
            const song = songs[currentSongIndex];
            updateStatus(`${song.title} • ${formatTime(currentTime)} / ${formatTime(duration)}`);
        }
        
        const progressBar = document.getElementById('progress-bar');
        if (duration) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;
        } else {
            progressBar.style.width = '0%';
        }
    }
}

function playRandomSong() {
    if (songs.length === 0) return;
    
    let randomIndex;
    if (songs.length === 1) {
        randomIndex = 0;
    } else {
        do {
            randomIndex = Math.floor(Math.random() * songs.length);
        } while (randomIndex === currentSongIndex && songs.length > 1);
    }
    
    currentSongIndex = randomIndex;
    const song = songs[currentSongIndex];
    player.src = song.file;
    player.play();
}

player.addEventListener('play', () => {
    document.getElementById('play-icon').style.display = 'none';
    document.getElementById('pause-icon').style.display = 'block';
    updateMediaSessionMetadata();
    
    clearInterval(progressInterval);
    progressInterval = setInterval(updateProgress, 1000);
    updateProgress();
});

player.addEventListener('pause', () => {
    document.getElementById('play-icon').style.display = 'block';
    document.getElementById('pause-icon').style.display = 'none';
    clearInterval(progressInterval);
    
    if (currentSongIndex !== -1) {
        updateStatus(`Paused: ${songs[currentSongIndex].title}`);
    } else {
        updateStatus("Paused");
    }
});

player.addEventListener('ended', () => {
    clearInterval(progressInterval);
    playRandomSong();
});

player.addEventListener('error', () => {
    updateStatus("Error playing audio. Skipping...");
    setTimeout(() => {
        playRandomSong();
    }, 2000);
});

// Controls
document.getElementById('play-pause-btn').addEventListener('click', () => {
    if (currentSongIndex === -1) {
        playRandomSong();
    } else if (player.paused) {
        player.play();
    } else {
        player.pause();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    playRandomSong();
});

document.getElementById('prev-btn').addEventListener('click', () => {
    playRandomSong();
});

document.getElementById('progress-container').addEventListener('click', (e) => {
    if (currentSongIndex !== -1 && player.duration) {
        const containerWidth = e.currentTarget.offsetWidth;
        const clickX = e.offsetX;
        const newTime = (clickX / containerWidth) * player.duration;
        player.currentTime = newTime;
        updateProgress();
    }
});

function updateStatus(text) {
    document.getElementById('status-text').textContent = text;
}

// Media Session API integration for background control and lock screen
if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
        player.play();
    });
    navigator.mediaSession.setActionHandler('pause', () => {
        player.pause();
    });
    navigator.mediaSession.setActionHandler('previoustrack', () => {
        playRandomSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        playRandomSong();
    });
}

function updateMediaSessionMetadata() {
    if ('mediaSession' in navigator && currentSongIndex !== -1) {
        const song = songs[currentSongIndex];
        navigator.mediaSession.metadata = new MediaMetadata({
            title: song.title,
            artist: 'Local Player',
            album: 'Sukoon ke pal',
            artwork: [
                { src: 'SONGAPP BACKGROUND.png', sizes: '512x512', type: 'image/png' }
            ]
        });
    }
}
