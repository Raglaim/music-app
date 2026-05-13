const baseUrl = window.location.origin;

// ==========================================
// ENVIRONMENT TOGGLE
// Set to 'true' to use mock data, 'false' to connect to your real server
// ==========================================
const DEV_MODE = false;

// --- ON PAGE LOAD ---
window.onload = () => {
    const token = localStorage.getItem("access_token");
    if (token) {
        showMusicPlayer();
        fetchSongs();
    }
};

// --- LOGIN FUNCTION ---
async function login() {
    const usernameInput = document.getElementById("username").value;
    const passwordInput = document.getElementById("password").value;
    const errorText = document.getElementById("error-message");
    document.getElementById("music-screen").style.overflowY = "hidden";

    errorText.innerText = ""; // Clear previous errors

    if (!usernameInput || !passwordInput) {
        errorText.innerText = "Please enter both username and password.";
        return;
    }

    if (DEV_MODE) {
        // --- MOCK LOGIN ---
        console.log("Dev Mode: Simulating login...");
        localStorage.setItem("access_token", "fake-dev-token-123");
        showMusicPlayer();
        fetchSongs();
    } else {
        // --- REAL SERVER LOGIN ---
        const formData = new URLSearchParams();
        formData.append("username", usernameInput);
        formData.append("password", passwordInput);

        try {
            const response = await fetch(`${baseUrl}/token`, {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                localStorage.setItem("access_token", data.access_token);
                showMusicPlayer();
                fetchSongs();
            } else {
                errorText.innerText = "Incorrect username or password.";
            }
        } catch (error) {
            console.error("Login error:", error);
            errorText.innerText = "Server error. Try again.";
        }
    }
}

// --- LOGOUT FUNCTION ---
function logout() {
    localStorage.removeItem("access_token");
    
    // Hide music screen, show auth screen (Using new fade classes)
    document.getElementById("music-screen").classList.add('hidden');
    document.getElementById("login-screen").classList.remove('hidden');
    
    document.getElementById("password").value = "";
    document.getElementById("library").innerHTML = ""; // Clear library
}

// --- UI HELPER ---
function showMusicPlayer() {
    // Hide auth screen, show music screen (Using new fade classes)
    document.getElementById("login-screen").classList.add('hidden');
    document.getElementById("music-screen").classList.remove('hidden'); 
    document.getElementById("music-screen").style.overflowY = "auto";
}

// --- FETCH SONGS ---
async function fetchSongs() {
    const libraryDiv = document.getElementById("library");
    libraryDiv.innerHTML = "<p style='color: var(--text-color-2); margin: 20px;'>Loading library...</p>"; 

    let songs = [];

    if (DEV_MODE) {
        // --- MOCK DATA ---
        console.log("Dev Mode: Loading mock songs...");
        songs = [
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" },
            { id: 1, title: "Dev Song 1", artist: "Coder" },
            { id: 2, title: "Dev Song 2", artist: "The Debuggers" },
            { id: 3, title: "Coffee & Code", artist: "Lo-Fi Beats" }
        ];
        // Slight artificial delay for realism
        await new Promise(resolve => setTimeout(resolve, 300)); 
    } else {
        // --- REAL SERVER FETCH ---
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${baseUrl}/songs`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.status === 401) {
                console.warn("Unauthorized. Token may be expired.");
                logout(); // Kick them out if token is invalid
                return;
            }

            if (response.ok) {
                songs = await response.json();
            } else {
                libraryDiv.innerHTML = "<p style='color: red; margin: 20px;'>Failed to load songs.</p>";
                return;
            }
        } catch (error) {
            console.error("Fetch songs error:", error);
            libraryDiv.innerHTML = "<p style='color: red; margin: 20px;'>Server connection failed.</p>";
            return;
        }
    }

    // --- RENDER SONGS (Works for both Dev and Real data) ---
    libraryDiv.innerHTML = ""; 

    songs.forEach(song => {
        const songDiv = document.createElement("div");
        songDiv.className = "song-item";
        
        // Basic styling just so you can see it against the dark background
        songDiv.style.padding = "10px";
        songDiv.style.margin = "5px 20px";
        songDiv.style.cursor = "pointer";
        songDiv.style.borderBottom = "1px solid rgba(255,255,255,0.1)";
        
        songDiv.innerText = `${song.title} - ${song.artist}`;
        
        songDiv.onclick = () => {
            console.log(`Playing: ${song.title}`);
            const audioPlayer = document.getElementById("audio-player");
            
            // --- NEW: Update the Player UI ---
            // 1. Grab the elements in the bottom left
            const playerTitle = document.querySelector(".player-left .title");
            const playerArtist = document.querySelector(".player-left .artist");
            const playerImage = document.querySelector(".player-left img");

            // 2. Update their content with the clicked song's data
            playerTitle.innerText = song.title;
            playerArtist.innerText = song.artist;
            playerImage.src = `${baseUrl}${song.thumbnail_path}`;
            playerImage.style.borderRadius = "5px";

            audioPlayer.src = `${baseUrl}/stream/${song.id}`;
            audioPlayer.play().catch(e => {
                if (DEV_MODE) {
                    console.log("Audio play failed: No server found in Dev Mode.");
                } else {
                    console.error("Audio playback error:", e);
                }
            });
        };
        
        libraryDiv.appendChild(songDiv);
    });
}

// ==========================================
// SIDEBAR & DROPDOWN LOGIC
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Sidebar Toggle (Mini Mode) ---
    const sidebar = document.querySelector(".sidebar");
    const sidebarToggleBtn = document.getElementById("sidebar-toggle");
    const sidebarToggleBtnArrow = document.getElementById("sidebar-toggl-arrow");


    sidebarToggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("mini");
        sidebarToggleBtnArrow.classList.toggle("rotated");
    });

    // --- 2. Dropdown Menus ---
    const libraryToggle = document.getElementById("my-library-toggle");
    const libraryMenu = document.getElementById("library-drop-down-menu");

    const playlistsToggle = document.getElementById("playlists-header-row");
    const playlistsMenu = document.getElementById("playlists-drop-down-menu");

    function setupDropdown(toggleBtn, menu) {
        if (!toggleBtn || !menu) return;

        toggleBtn.addEventListener("click", () => {
            // Toggle the menu visibility
            menu.classList.toggle("collapsed");

            // Update ARIA for screen readers
            const isCollapsed = menu.classList.contains("collapsed");
            toggleBtn.setAttribute("aria-expanded", !isCollapsed);

            // Rotate the arrow icon
            const arrow = toggleBtn.querySelector(".arrow-icon");
            if (arrow) {
                arrow.classList.toggle("rotated");
            }
        });
    }

    setupDropdown(libraryToggle, libraryMenu);
    setupDropdown(playlistsToggle, playlistsMenu);

    // --- 3. Stop Event Bubbling for Playlist Action Buttons ---
    // This stops the + and = buttons from closing the playlist menu when clicked
    const addPlaylistBtn = document.getElementById("add-playlist");
    const listViewBtn = document.getElementById("list-view-toggle");

    if (addPlaylistBtn) {
        addPlaylistBtn.addEventListener("click", (event) => {
            event.stopPropagation(); 
            console.log("Create playlist clicked!");
        });
    }

    if (listViewBtn) {
        listViewBtn.addEventListener("click", (event) => {
            event.stopPropagation(); 
            console.log("List view clicked!");
        });
    }
});

// ==========================================
// AUDIO PLAYER CONTROLS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const audioPlayer = document.getElementById("audio-player");
    const playPauseBtn = document.querySelector(".play-pause");
    const playIcon = playPauseBtn.querySelector(".play");
    const pauseIcon = playPauseBtn.querySelector(".pause");

    // 1. Handle the button click
    playPauseBtn.addEventListener("click", () => {
        // Prevent errors if the user clicks play before selecting a song
        if (!audioPlayer.src || audioPlayer.src.endsWith(window.location.host + "/")) {
            console.log("Please select a song from the library first.");
            return; 
        }

        // Toggle play/pause state
        if (audioPlayer.paused) {
            audioPlayer.play();
        } else {
            audioPlayer.pause();
        }
    });

    // 2. Automatically update the UI when the audio starts playing
    // (This triggers when the button is clicked AND when a song is selected from the library)
    audioPlayer.addEventListener("play", () => {
        playIcon.style.display = "none";
        pauseIcon.style.display = "block";
    });

    // 3. Automatically update the UI when the audio pauses
    audioPlayer.addEventListener("pause", () => {
        playIcon.style.display = "block";
        pauseIcon.style.display = "none";
    });

    // ==========================================
    // PROGRESS BAR & TIMERS
    // ==========================================
    
    // Select the elements from your HTML
    const progressBar = document.querySelector(".progress-bar input[type='range']");
    const currentTimeText = document.getElementById("current-time");
    const totalTimeText = document.getElementById("total-time");

    // Helper function to format seconds into M:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        // Adds a leading zero if seconds are less than 10
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    }

    // 1. When a new song loads, set the total time and max value of the slider
    audioPlayer.addEventListener("loadedmetadata", () => {
        const duration = audioPlayer.duration;
        totalTimeText.innerText = formatTime(duration);
        
        // Set the slider's maximum value to the song's total seconds
        progressBar.max = Math.floor(duration);
        progressBar.value = 0; // Reset slider to the start
    });

    // 2. As the song plays, update the current time text and slider position
    audioPlayer.addEventListener("timeupdate", () => {
        const current = audioPlayer.currentTime;
        currentTimeText.innerText = formatTime(current);
        
        // Only update the slider if the user isn't actively dragging it
        // (We don't want it jumping around while they hold it)
        progressBar.value = Math.floor(current);
    });

    // 3. Let the user drag the slider to seek to a new part of the song
    progressBar.addEventListener("input", () => {
        audioPlayer.currentTime = progressBar.value;
    });
});

    