let player = new Audio();
let currentSongIndex = -1;

const songs = [];

async function loadSongs() {
    try {
        if (typeof songsDataText === 'undefined') {
            throw new Error("songsData.js is missing or not loaded correctly.");
        }
        const text = songsDataText;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        const tempSongs = [];
        for (const line of lines) {
            const lineParts = line.split('|');
            const url = lineParts[0].trim();
            const startTime = lineParts.length > 1 ? parseFloat(lineParts[1].trim()) : 0;

            // Check if it's a KoshalWorld download link
            if (url.includes('koshalworld.com/download/')) {
                const parts = url.split('/');
                const id = parts[parts.length - 2];
                const rawTitle = parts[parts.length - 1].replace('.html', '');
                
                // Format title (e.g. suno-kaho -> Suno Kaho)
                const title = rawTitle.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                
                tempSongs.push({
                    title: title,
                    file: `https://koshalworld.com/files/download/type/320/id/${id}`,
                    startTime: startTime
                });
            } else if (url.includes('koshalworld.com/files/download/')) {
                // If they pasted the direct link directly
                tempSongs.push({
                    title: "Unknown Song",
                    file: url,
                    startTime: startTime
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

function playSong(index) {
    if (songs.length === 0) return;
    
    currentSongIndex = index;
    const song = songs[currentSongIndex];
    player.src = song.file;
    player.play();
}

function playNextSong() {
    if (songs.length === 0) return;
    let nextIndex = (currentSongIndex + 1) % songs.length;
    playSong(nextIndex);
}

function playPrevSong() {
    if (songs.length === 0) return;
    let prevIndex = currentSongIndex - 1;
    if (prevIndex < 0) {
        prevIndex = songs.length - 1;
    }
    playSong(prevIndex);
}

player.addEventListener('loadedmetadata', () => {
    if (currentSongIndex !== -1) {
        const song = songs[currentSongIndex];
        if (song.startTime > 0) {
            player.currentTime = song.startTime;
        }
    }
});

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
    playNextSong();
});

player.addEventListener('error', () => {
    updateStatus("Error playing audio. Skipping...");
    setTimeout(() => {
        playNextSong();
    }, 2000);
});

// Controls
document.getElementById('play-pause-btn').addEventListener('click', () => {
    if (currentSongIndex === -1) {
        playSong(0);
    } else if (player.paused) {
        player.play();
    } else {
        player.pause();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    playNextSong();
});

document.getElementById('prev-btn').addEventListener('click', () => {
    playPrevSong();
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
        playPrevSong();
    });
    navigator.mediaSession.setActionHandler('nexttrack', () => {
        playNextSong();
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
