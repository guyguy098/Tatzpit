function adjustStatBarPosition() {
	const header = document.querySelector('.header');
	const statsBar = document.querySelector('.stats-bar');
	const mainContent = document.querySelector('.main-content');
	
	const headerHeight = header.getBoundingClientRect().height;
	statsBar.style.top = headerHeight + 'px';

	// Read stats bar height AFTER setting its top position
	setTimeout(() => {
		const statsBarHeight = statsBar.getBoundingClientRect().height;
		mainContent.style.paddingTop = (headerHeight + statsBarHeight + 10) + 'px';
	}, LAYOUT_READ_DELAY_MS);
}
window.addEventListener('resize', () => {
	clearTimeout(window.resizeTimer);
	window.resizeTimer = setTimeout(adjustStatBarPosition, 50);
});

// Keyboard shortcuts
function isTyping(event) {
	const tag = event.target.tagName;
	return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' 
		|| event.target.isContentEditable;
}

document.addEventListener('keydown', function(event) {
	if (isTyping(event)) return;

	if (event.key.toLowerCase() === 's') {
		event.preventDefault();
		stopAllVideos();
	}

	if (event.key.toLowerCase() === 'f') {
		event.preventDefault();
		const focusedVideo = document.querySelector('video:focus');
		if (focusedVideo) {
			toggleFullscreen(focusedVideo);
		}
	}
});

// Stop all active videos
function stopAllVideos() {
	const activeVideoIds = Array.from(activeStreams).filter(id => !id.endsWith('_preview'));
	activeVideoIds.forEach(videoId => stopVideo(videoId));
}

// Toggle fullscreen for video
function toggleFullscreen(video) {
	if (!document.fullscreenElement) {
		video.requestFullscreen().catch(err => {
			console.error('Error attempting to enable fullscreen:', err);
		});
	} else {
		document.exitFullscreen();
	}
}

// Intersection Observer for performance optimization - DISABLED auto-play
const observer = new IntersectionObserver((entries) => {
	entries.forEach(entry => {
		const video = entry.target.querySelector('video');
		if (!video) return;
		if (!entry.isIntersecting && activeStreams.has(video.id)) {
			video.pause(); // pause only, don't destroy
		}
	});
}, {
	threshold: 0.1
});

// Mobile menu functions
function openMobileMenu() {
	document.getElementById('mobileSidebar').classList.add('active');
	document.getElementById('mobileMenuOverlay').classList.add('active');
	document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
	document.getElementById('mobileSidebar').classList.remove('active');
	document.getElementById('mobileMenuOverlay').classList.remove('active');
	document.body.style.overflow = 'auto';
}

function toggleDropdown(id) {
	const list = document.getElementById(id + '-list');
	// Close all other dropdowns first
	document.querySelectorAll('.custom-dropdown-list.open').forEach(el => {
		if (el.id !== id + '-list') el.classList.remove('open');
	});
	list.classList.toggle('open');
}

function openUrl(url, dropdownId) {
	window.open(url, '_blank');
	// Close dropdown and reset label
	document.getElementById(dropdownId + '-list').classList.remove('open');
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
	if (!e.target.closest('.custom-dropdown')) {
		document.querySelectorAll('.custom-dropdown-list.open').forEach(el => {
			el.classList.remove('open');
		});
	}
});