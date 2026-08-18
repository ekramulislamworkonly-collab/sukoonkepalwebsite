let player = new Audio();
let currentSongIndex = -1;

const songs = [
    { title: "Suno Kaho Kaha Suna", file: "https://koshalworld.com/files/download/type/320/id/28972" },
    { title: "Mere Sathi Ho Jeevan Sathi", file: "https://koshalworld.com/files/download/type/320/id/30163" },
    { title: "Humne Tumko Dekha", file: "https://koshalworld.com/files/download/type/320/id/29801" },
    { title: "Dil Cheez Kya Hai", file: "https://koshalworld.com/files/download/type/320/id/31298" },
    { title: "Aur Sunao Kya Haal Hai", file: "https://koshalworld.com/files/download/type/320/id/37195" },
    { title: "Yeh Duniya Yeh Mehfil Mere Kaam Ki Nahi", file: "https://koshalworld.com/files/download/type/320/id/37196" },
    { title: "Chhodo Kal Ki Baatein", file: "https://koshalworld.com/files/download/type/320/id/37699" },
    { title: "Tujhe Jeevan Ki Dor Se", file: "https://koshalworld.com/files/download/type/320/id/38153" }
];

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
