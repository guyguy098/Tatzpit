// Generate poster image for video containers
function generatePosterImage(videoId, region) {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 360;
	const ctx = canvas.getContext('2d');
	
	// Create solid dark background instead of colored gradient
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, 0, 640, 360);
	
	// Add region indicator
	ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
	ctx.fillRect(0, 320, 640, 40);
	
	ctx.fillStyle = 'white';
	ctx.font = 'bold 20px Arial';
	ctx.textAlign = 'center';
	ctx.fillText(`${region.toUpperCase()} NEWS`, 320, 345);
	
	// Add play icon
	ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
	ctx.beginPath();
	ctx.moveTo(290, 160);
	ctx.lineTo(290, 200);
	ctx.lineTo(320, 180);
	ctx.closePath();
	ctx.fill();
	
	return canvas.toDataURL();
}

// Generate red X image for unavailable streams
function generateUnavailableImage() {
	const canvas = document.createElement('canvas');
	canvas.width = 640;
	canvas.height = 360;
	const ctx = canvas.getContext('2d');
	
	// Dark background
	ctx.fillStyle = '#1a1a1a';
	ctx.fillRect(0, 0, 640, 360);
	
	// Red X
	ctx.strokeStyle = '#ff0000';
	ctx.lineWidth = 8;
	ctx.lineCap = 'round';
	
	// Draw X (two diagonal lines)
	ctx.beginPath();
	// Top-left to bottom-right
	ctx.moveTo(200, 120);
	ctx.lineTo(440, 240);
	// Top-right to bottom-left
	ctx.moveTo(440, 120);
	ctx.lineTo(200, 240);
	ctx.stroke();
	
	// "UNAVAILABLE" text
	ctx.fillStyle = '#ff0000';
	ctx.font = 'bold 24px Arial';
	ctx.textAlign = 'center';
	ctx.fillText('STREAM UNAVAILABLE', 320, 290);
	
	return canvas.toDataURL();
}

// Initialize poster images for all videos
function initializePosters() {
	const videoContainers = document.querySelectorAll('.video-container');
	videoContainers.forEach(container => {
		const video = container.querySelector('video');
		const region = container.getAttribute('data-region');
		const posterUrl = generatePosterImage(video.id, region);
		video.poster = posterUrl;
	});
}

// Auto-load all videos and pause them to show first frame
function autoLoadAllVideos() {
	let activePreviewCount = 0;
	const queue = [];

	document.querySelectorAll('.video-container').forEach(container => {
		const video = container.querySelector('video');
		const playOverlay = container.querySelector('.play-overlay');
		const onclickStr = playOverlay.getAttribute('onclick') || '';
		const allMatches = onclickStr.match(/'([^']+)'/g);
		// First match = videoId, second match = stream URL
		if (allMatches && allMatches.length >= 2) {
			const streamUrl = allMatches[1].replace(/'/g, '');
			if (streamUrl.startsWith('http')) {
				queue.push({ videoId: video.id, streamUrl });
			}
		}
	});

	function loadNext() {
		while (activePreviewCount < MAX_CONCURRENT_PREVIEWS && queue.length > 0) {
			const { videoId, streamUrl } = queue.shift();
			activePreviewCount++;
			loadVideoForPreview(videoId, streamUrl, () => {
				activePreviewCount--;
				loadNext();
			});
		}
	}

	loadNext();
}

// Load video just to get first frame, then pause
function loadVideoForPreview(videoId, streamUrl, onComplete) {
	let completed = false;
	const video = document.getElementById(videoId);
	const videoContainer = video.closest('.video-container');
	
	// Track preview loading for bandwidth calculation
	activeStreams.add(videoId + '_preview');
	updateStats();
	
	if (Hls.isSupported()) {
		const hls = new Hls({
			enableWorker: false,
			lowLatencyMode: false,
			backBufferLength: 1,
			maxBufferLength: 3
		});
		
		hls.loadSource(streamUrl);
		hls.attachMedia(video);
		
		// Wait for first frame to be ready
		video.addEventListener('loadeddata', function() {
			video.play().then(() => {
				// Wait a moment for frame to display
				setTimeout(() => {
					// Capture the current frame as canvas image
					const canvas = document.createElement('canvas');
					canvas.width = video.videoWidth || 640;
					canvas.height = video.videoHeight || 360;
					const ctx = canvas.getContext('2d');
					
					try {
						// Draw current video frame to canvas
						ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
						
						// Convert to poster image
						const posterUrl = canvas.toDataURL('image/jpeg', 0.8);
						
						// Pause and destroy HLS
						video.pause();
						hls.destroy();
						
						// Set the captured frame as poster
						video.poster = posterUrl;
						video.src = '';
						video.load();
						
					} catch (error) {
						console.log('Could not capture frame for', videoId, error);
						// Fallback: just pause and destroy
						video.pause();
						hls.destroy();
						video.src = '';
						video.load();
					}
					
					// Remove from active streams
					completed = true;
					activeStreams.delete(videoId + '_preview');
					updateStats();
					if (onComplete) onComplete();
					
				}, PREVIEW_FRAME_DELAY_MS); // Wait 1 second for stable frame
			}).catch(() => {
				completed = true;
				// Set red X image as poster
				const unavailableImage = generateUnavailableImage();
				video.poster = unavailableImage;
				video.src = '';
				video.load();
				
				// Remove controls and play overlay
				video.removeAttribute('controls');
				const playOverlay = videoContainer.querySelector('.play-overlay');
				if (playOverlay) {
					playOverlay.style.display = 'none';
				}
				
				// Mark container as unavailable
				videoContainer.classList.add('stream-unavailable');
				
				hls.destroy();
				activeStreams.delete(videoId + '_preview');
				updateStats();
				if (onComplete) onComplete();
			});
		}, { once: true });
		
		hls.on(Hls.Events.ERROR, function(event, data) {
			if (completed) return;
			if (!data.fatal) return;
			completed = true;
			console.log('Preview load failed for', videoId);
			
			// Set red X image as poster
			const unavailableImage = generateUnavailableImage();
			video.poster = unavailableImage;
			video.src = '';
			video.load();
			
			// Remove controls and play overlay
			video.removeAttribute('controls');
			const playOverlay = videoContainer.querySelector('.play-overlay');
			if (playOverlay) {
				playOverlay.style.display = 'none';
			}
			
			// Mark container as unavailable
			videoContainer.classList.add('stream-unavailable');
			
			hls.destroy();
			activeStreams.delete(videoId + '_preview');
			updateStats();
			if (onComplete) onComplete();
		});
	} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
		video.src = streamUrl;
		video.addEventListener('loadeddata', function() {
			video.play().then(() => {
				setTimeout(() => {
					const canvas = document.createElement('canvas');
					canvas.width = video.videoWidth || 640;
					canvas.height = video.videoHeight || 360;
					const ctx = canvas.getContext('2d');
					try { ctx.drawImage(video, 0, 0, canvas.width, canvas.height); video.poster = canvas.toDataURL('image/jpeg', 0.8); } catch(e) {
						console.warn('Frame capture failed for preview:', e);
					}
					video.pause();
					video.src = '';
					video.load();
					activeStreams.delete(videoId + '_preview');
					updateStats();
					if (onComplete) onComplete();
				}, PREVIEW_FRAME_DELAY_MS);
			}).catch(() => {
				const unavailableImage = generateUnavailableImage();
				video.poster = unavailableImage;
				video.removeAttribute('controls');
				const playOverlay = videoContainer.querySelector('.play-overlay');
				if (playOverlay) playOverlay.style.display = 'none';
				videoContainer.classList.add('stream-unavailable');
				activeStreams.delete(videoId + '_preview');
				updateStats();
				if (onComplete) onComplete();
			});
		}, { once: true });
	} else {
		// Browser can't play HLS at all
		activeStreams.delete(videoId + '_preview');
		if (onComplete) onComplete();
	}
}

// Initialize bandwidth monitoring
function initializeBandwidthMonitoring() {
	bandwidthIntervalId = setInterval(() => {
		const hasActive = Array.from(activeStreams).some(id => !id.endsWith('_preview'));
		if (hasActive) updateBandwidthUsage();
	}, BANDWIDTH_POLL_MS);
}

// Update bandwidth usage display
function updateBandwidthUsage() {
	let totalBps = 0;

	loadedStreams.forEach((hls, videoId) => {
		if (!activeStreams.has(videoId)) return;

		if (hls === true) {
			// Native HLS (Safari) — read bitrate from video element
			const video = document.getElementById(videoId);
			if (video && video.webkitVideoDecodedByteCount !== undefined) {
				// Rough estimate from decoded bytes if available
				totalBps += 2_500_000; // fallback: 2.5 Mbps for native
			} else {
				totalBps += 2_500_000; // fallback: 2.5 Mbps
			}
			return;
		}

		if (!hls || !hls.levels) return;

		// Try current level bitrate first
		const level = hls.levels[hls.currentLevel];
		if (level && level.bitrate) {
			totalBps += level.bitrate;
			return;
		}

		// Fallback: if currentLevel not set yet, use lowest available level
		const fallbackLevel = hls.levels.find(l => l.bitrate > 0);
		if (fallbackLevel) {
			totalBps += fallbackLevel.bitrate;
			return;
		}

		// Last resort: use HLS.js bandwidth estimate divided by active stream count
		if (hls.bandwidthEstimate) {
			const realCount = Array.from(activeStreams).filter(id => !id.endsWith('_preview')).length;
			totalBps += hls.bandwidthEstimate / (realCount || 1);
		}
	});

	const totalMbps = totalBps / 1_000_000;
	const bandwidthElement = document.getElementById('bandwidthUsage');

	if (totalMbps > 0) {
		bandwidthElement.textContent = `${totalMbps.toFixed(1)} Mbps`;
		bandwidthElement.style.color = totalMbps >= BANDWIDTH_LIMIT_MBPS ? '#ef4444' : '#4f46e5';
	} else {
		bandwidthElement.textContent = '0 Mbps';
		bandwidthElement.style.color = '#22c55e';
	}
}

// Play video function - only loads when clicked
function playVideo(videoId, streamUrl) {
	const videoContainer = document.querySelector(`#${videoId}`).closest('.video-container');
	const video = document.getElementById(videoId);
	const loadingIndicator = videoContainer.querySelector('.loading-indicator');

	// Show loading indicator
	loadingIndicator.style.display = 'block';

	// Check if stream is already loaded
	if (loadedStreams.has(videoId)) {
		// Still enforce limit even for previously loaded streams
		const realActiveStreams = Array.from(activeStreams).filter(id => !id.endsWith('_preview'));
		if (realActiveStreams.length >= MAX_ACTIVE_STREAMS && !activeStreams.has(videoId)) {
			loadingIndicator.style.display = 'none';
			showErrorMessage(videoContainer, 'Bandwidth limit reached (6 streams / 15 Mbps). Stop a stream first.');
			return;
		}
		video.play();
		video.classList.add('playing');
		videoContainer.classList.add('playing');
		activeStreams.add(videoId);
		loadingIndicator.style.display = 'none';
		updateStats();
		return;
	}

	// Enforce limit for new streams
	const realActiveStreams = Array.from(activeStreams).filter(id => !id.endsWith('_preview'));
	if (realActiveStreams.length >= MAX_ACTIVE_STREAMS && !activeStreams.has(videoId)) {
		loadingIndicator.style.display = 'none';
		showErrorMessage(videoContainer, 'Bandwidth limit reached (6 streams / 15 Mbps). Stop a stream first.');
		return;
	}

	// Load stream
	if (Hls.isSupported()) {
		const hls = new Hls({
			enableWorker: false,
			lowLatencyMode: true,
			backBufferLength: 30
		});
		
		hls.loadSource(streamUrl);
		hls.attachMedia(video);
		
		hls.on(Hls.Events.MANIFEST_PARSED, function() {
			loadingIndicator.style.display = 'none';
			video.classList.add('playing');
			videoContainer.classList.add('playing');
			activeStreams.add(videoId);
			loadedStreams.set(videoId, hls);
			
			// ADD THESE LINES - Track play/pause events for bandwidth
			// Cancel any old listeners before adding new ones
			if (videoListenerControllers.has(videoId)) {
				videoListenerControllers.get(videoId).abort();
			}
			const ac = new AbortController();
			videoListenerControllers.set(videoId, ac);

			video.addEventListener('play', function() {
				activeStreams.add(videoId);
				videoContainer.classList.add('playing');
				video.classList.add('playing');
				updateStats();
			}, { signal: ac.signal });

			video.addEventListener('pause', function() {
				activeStreams.delete(videoId);
				videoContainer.classList.remove('playing');
				video.classList.remove('playing');
				updateStats();
			}, { signal: ac.signal });
			
			video.play();
			updateStats();
		});
		
		hls.on(Hls.Events.ERROR, function(event, data) {
			if (!data.fatal) return;
			console.error('HLS Error:', data);
			loadingIndicator.style.display = 'none';
			showErrorMessage(videoContainer, 'Stream unavailable');
		});
		
	} else if (video.canPlayType('application/vnd.apple.mpegurl')) {
		video.src = streamUrl;
		video.addEventListener('loadeddata', function() {
			loadingIndicator.style.display = 'none';
			video.classList.add('playing');
			videoContainer.classList.add('playing');
			activeStreams.add(videoId);
			loadedStreams.set(videoId, true);

			// Cancel any old listeners before adding new ones
			if (videoListenerControllers.has(videoId)) {
				videoListenerControllers.get(videoId).abort();
			}
			const ac = new AbortController();
			videoListenerControllers.set(videoId, ac);
			
			video.addEventListener('play', function() {
				activeStreams.add(videoId);
				videoContainer.classList.add('playing');
				video.classList.add('playing');
				updateStats();
			}, { signal: ac.signal });
			
			video.addEventListener('pause', function() {
				activeStreams.delete(videoId);
				videoContainer.classList.remove('playing');
				video.classList.remove('playing');
				updateStats();
			}, { signal: ac.signal });
			
			video.play();
			updateStats();
		}, { once: true });
		
		video.addEventListener('error', function() {
			loadingIndicator.style.display = 'none';
			showErrorMessage(videoContainer, 'Stream unavailable');
		}, { once: true });
	}
}

// Stop video and free resources
function stopVideo(videoId) {
	const video = document.getElementById(videoId);
	const videoContainer = video.closest('.video-container');
	
	// On iPhone, capture last frame before stopping and show it as poster
	if (video.readyState >= 2) {
		try {
			const canvas = document.createElement('canvas');
			canvas.width = video.videoWidth || 320;
			canvas.height = video.videoHeight || 180;
			canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
			const snapshot = canvas.toDataURL('image/jpeg', 0.8);
			const existingImg = videoContainer.querySelector('img[style*="position:absolute"]');
			if (existingImg) {
				existingImg.src = snapshot;
			} else {
				const header = videoContainer.querySelector('.video-header');
				const headerH = header ? header.offsetHeight : 0;
				const img = document.createElement('img');
				img.src = snapshot;
				img.style.cssText = `position:absolute;top:${headerH}px;left:0;width:100%;height:calc(100% - ${headerH}px);object-fit:fill;z-index:5;pointer-events:none;display:block;`;
				videoContainer.appendChild(img);
				video.addEventListener('play', () => { img.remove(); }, { once: true });
			}
		} catch(e) {
			console.warn('Snapshot capture failed for', videoId, e);
		}
	}
	
	video.pause();
	
	if (loadedStreams.has(videoId) && loadedStreams.get(videoId) !== true) {
		const hls = loadedStreams.get(videoId);
		hls.destroy();
	}
	video.removeAttribute('src');
	video.load();
	
	loadedStreams.delete(videoId);
	activeStreams.delete(videoId);
	videoContainer.classList.remove('playing');
	video.classList.remove('playing');
	if (videoListenerControllers.has(videoId)) {
		videoListenerControllers.get(videoId).abort();
		videoListenerControllers.delete(videoId);
	}
	
	updateStats();
}

// Show error message
function showErrorMessage(container, message) {
	const errorDiv = document.createElement('div');
	errorDiv.style.cssText = `
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(239, 68, 68, 0.9);
		color: white;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.9rem;
		z-index: 20;
	`;
	errorDiv.textContent = message;
	container.appendChild(errorDiv);
	
	setTimeout(() => {
		errorDiv.remove();
	}, ERROR_DISPLAY_MS);
}