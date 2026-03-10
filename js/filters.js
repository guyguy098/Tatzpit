function toggleAll(event) {
	event.preventDefault();
	const allCheckbox = document.getElementById('allCheckbox');
	const allFilter = document.getElementById('allFilter');
	const isChecked = !allCheckbox.checked;

	allCheckbox.checked = isChecked;
	allFilter.classList.toggle('active', isChecked);

	// Set all region filters to match
	document.querySelectorAll('.region-filter:not(#allFilter)').forEach(filter => {
		filter.classList.toggle('active', isChecked);
		filter.querySelector('input').checked = isChecked;
	});

	// Reset custom layout
	document.querySelector('.custom-layout-btn').classList.remove('active');
	customSelectedChannels.clear();
	updateCustomControls();
	customLayoutApplied = false;
	
	filterVideos();
	updateStats();
}

// Initialize region filters
function initializeFilters() {
	const regionFilters = document.querySelectorAll('.region-filter:not(#allFilter)');
	
	regionFilters.forEach(filter => {
		filter.addEventListener('click', function(event) {
			event.preventDefault();          // ← add this line
			const checkbox = this.querySelector('input');
			const isChecked = !checkbox.checked;
			checkbox.checked = isChecked;
			this.classList.toggle('active', isChecked);

			document.querySelector('.custom-layout-btn').classList.remove('active');
			customSelectedChannels.clear();
			customLayoutApplied = false;
			document.querySelectorAll('.video-container:not(.stream-unavailable)').forEach(c => c.classList.remove('hidden'));
			updateCustomControls();

			// Sync All button — active only if all region filters are checked
			const allChecked = Array.from(document.querySelectorAll('.region-filter:not(#allFilter) input')).every(cb => cb.checked);
			document.getElementById('allCheckbox').checked = allChecked;
			document.getElementById('allFilter').classList.toggle('active', allChecked);

			filterVideos();
			updateStats();
		});
	});
}

// Initialize grid selector
function initializeGridSelector() {
	const gridSelector = document.getElementById('gridSelector');
	gridSelector.addEventListener('change', function() {
		changeGrid(this.value);
	});
	updateGridOptionsForOrientation();
	window.addEventListener('resize', updateGridOptionsForOrientation);
	window.addEventListener('orientationchange', updateGridOptionsForOrientation);
}

function updateGridOptionsForOrientation() {
	if (customSelectedChannels.size > 0) return;
	const selector = document.getElementById('gridSelector');
	const currentVal = selector.value;
	
	// Use screen.orientation if available, fallback to dimensions
	let isLandscapeMobile;
	if (screen.orientation) {
		const angle = screen.orientation.angle;
		const type = screen.orientation.type;
		const isLandscape = type.includes('landscape') || angle === 90 || angle === 270;
		const isSmallScreen = Math.min(screen.width, screen.height) <= 900;
		isLandscapeMobile = isLandscape && isSmallScreen;
	} else {
		isLandscapeMobile = window.innerHeight < window.innerWidth && window.innerWidth <= 900;
	}

	if (isLandscapeMobile) {
		if (lastOrientationWasLandscape === true) return;
		lastOrientationWasLandscape = true;
		selector.innerHTML = `
			<option value="grid-2xY">2xY</option>
			<option value="grid-3xY">3xY</option>
		`;
		if (!selector.querySelector(`option[value="${currentVal}"]`)) {
			changeGrid('grid-2xY');
		}
	} else {
		if (lastOrientationWasLandscape === false) return;
		lastOrientationWasLandscape = false;
		selector.innerHTML = `
			<option value="grid-1xY">1xY</option>
			<option value="grid-2xY">2xY</option>
			<option value="grid-3xY" selected>3xY</option>
			<option value="grid-4xY">4xY</option>
			<option value="grid-5xY">5xY</option>
		`;
		if (!selector.querySelector(`option[value="${currentVal}"]`)) {
			changeGrid('grid-3xY');
		}
	}
}

// Filter videos based on region selection
function filterVideos() {
	const arabChecked = document.getElementById('arabCheckbox').checked;
	const israelChecked = document.getElementById('israelCheckbox').checked;
	const usaChecked = document.getElementById('usaCheckbox').checked;
	const iranChecked = document.getElementById('iranCheckbox').checked;
	const worldChecked = document.getElementById('worldCheckbox').checked;
	
	const videoContainers = document.querySelectorAll('.video-container');
	
	videoContainers.forEach(container => {
		const region = container.getAttribute('data-region');
		let shouldShow = false;
		
		switch(region) {
			case 'arab':
				shouldShow = arabChecked;
				break;
			case 'israel':
				shouldShow = israelChecked;
				break;
			case 'usa':
				shouldShow = usaChecked;
				break;
			case 'iran':
				shouldShow = iranChecked;
				break;
			case 'world':
				shouldShow = worldChecked;
				break;
		}
		
		if (shouldShow) {
			container.classList.remove('hidden');
		} else {
			container.classList.add('hidden');
			
			// Stop video if it's playing and region is hidden
			const video = container.querySelector('video');
			if (video && activeStreams.has(video.id)) {
				stopVideo(video.id);
			}
		}
	});
}

// Change grid layout
function changeGrid(gridClass) {
	const gridContainer = document.getElementById('gridContainer');
	
	// Remove all grid classes
	gridContainer.classList.remove('grid-1xY', 'grid-2xY', 'grid-3xY', 'grid-4xY', 'grid-5xY');
	
	// Add new grid class
	gridContainer.classList.add(gridClass);
}

// Update statistics
function updateStats() {
	const visibleContainers = document.querySelectorAll('.video-container:not(.hidden)');
	const activeStreamCount = Array.from(activeStreams).filter(id => !id.endsWith('_preview')).length;
	const visibleChannelCount = visibleContainers.length;
	
	document.getElementById('activeStreams').textContent = activeStreamCount;
	document.getElementById('visibleChannels').textContent = visibleChannelCount;
	
	// Update bandwidth monitoring
	updateBandwidthUsage();
}