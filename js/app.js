// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
	initializePosters();
	initializeFilters();
	initializeGridSelector();
	initializeBandwidthMonitoring();
	const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
	if (!isIOS) {
		autoLoadAllVideos();
	}
	updateStats();
	setTimeout(adjustStatBarPosition, STAT_BAR_INIT_DELAY_MS);
	
	// Double-click to fullscreen
	document.querySelectorAll('video').forEach(video => {
		video.addEventListener('dblclick', function() {
			toggleFullscreen(this);
		});
	});

	// Observe all video containers for performance
	document.querySelectorAll('.video-container').forEach(container => {
		observer.observe(container);
	});
});