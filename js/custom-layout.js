// Show custom layout picker
function showCustomLayout() {
	initializeCustomLayout();
	document.getElementById('customLayoutOverlay').classList.add('active');
	document.querySelector('.custom-layout-btn').classList.add('active');
}

// Initialize custom layout controls
function initializeCustomLayout() {
	const channelPicker = document.getElementById('channelPicker');
	const videoContainers = document.querySelectorAll('.video-container');
	
	channelPicker.innerHTML = '';
	
	videoContainers.forEach(container => {
		const video = container.querySelector('video');
		const title = container.querySelector('.video-title').textContent;
		const region = container.getAttribute('data-region');
		const badge = container.querySelector('.country-badge');
		
		const isSelected = customSelectedChannels.has(video.id);
		const channelOption = document.createElement('div');
		channelOption.className = 'channel-option' + (isSelected ? ' selected' : '');
		channelOption.innerHTML = `
			<input type="checkbox" id="custom_${video.id}" value="${video.id}" ${isSelected ? 'checked' : ''}>
			<span class="country-badge ${badge.className.split(' ')[1]}">${region.toUpperCase()}</span>
			<span>${title}</span>
		`;
		
		channelOption.addEventListener('click', function(e) {
			if (e.target.type !== 'checkbox') {
				const checkbox = this.querySelector('input');
				checkbox.checked = !checkbox.checked;
			}
			toggleChannelSelection(video.id, this);
		});
		
		channelPicker.appendChild(channelOption);
	});
}

// Toggle channel selection
function toggleChannelSelection(videoId, optionElement) {
	const checkbox = optionElement.querySelector('input');
	
	if (checkbox.checked) {
		if (customSelectedChannels.size < 6) {
			customSelectedChannels.add(videoId);
			optionElement.classList.add('selected');
		} else {
			checkbox.checked = false;
			alert('Maximum 6 channels allowed');
		}
	} else {
		customSelectedChannels.delete(videoId);
		optionElement.classList.remove('selected');
	}
	
	updateCustomControls();
}

// Update custom controls state
function updateCustomControls() {
	const applyBtn = document.querySelector('.custom-controls .custom-btn');
	applyBtn.textContent = `Apply Layout (${customSelectedChannels.size}/6)`;
	applyBtn.disabled = customSelectedChannels.size === 0;
}

// Apply custom layout
function applyCustomLayout() {
	if (customSelectedChannels.size === 0) return;
	
	const allContainers = document.querySelectorAll('.video-container');
	
	// Hide all containers first
	allContainers.forEach(container => {
		container.classList.add('hidden');
	});
	
	// Show only selected containers
	customSelectedChannels.forEach(videoId => {
		const container = document.getElementById(videoId).closest('.video-container');
		container.classList.remove('hidden');
	});
	
	// Set appropriate grid based on selection count
	const gridContainer = document.getElementById('gridContainer');
	gridContainer.classList.remove('grid-1xY', 'grid-2xY', 'grid-3xY', 'grid-4xY', 'grid-5xY');
	
	if (customSelectedChannels.size === 1) {
		gridContainer.classList.add('grid-1xY');
	} else if (customSelectedChannels.size <= 4) {
		gridContainer.classList.add('grid-2xY');
	} else {
		gridContainer.classList.add('grid-3xY');
	}
	
	document.getElementById('customLayoutOverlay').classList.remove('active');
	// Keep button purple — custom layout is still active
	// Deactivate all region filter buttons
	document.querySelectorAll('.region-filter').forEach(filter => {
		filter.classList.remove('active');
		filter.querySelector('input').checked = false;
	});
	document.getElementById('allCheckbox').checked = false;
	document.getElementById('allFilter').classList.remove('active');
	customLayoutApplied = true;
	updateStats();
	
	const selector = document.getElementById('gridSelector');
	if (customSelectedChannels.size === 1) selector.value = 'grid-1xY';
	else if (customSelectedChannels.size <= 4) selector.value = 'grid-2xY';
	else selector.value = 'grid-3xY';
}


// Cancel custom layout
function cancelCustomLayout() {
	document.getElementById('customLayoutOverlay').classList.remove('active');
	// Only deactivate button if user hasn't applied a custom layout
	if (!customLayoutApplied) {
		document.querySelector('.custom-layout-btn').classList.remove('active');
	}
}

// Clear all selections
function clearSelection() {
	customSelectedChannels.clear();
	const options = document.querySelectorAll('.channel-option');
	options.forEach(option => {
		option.classList.remove('selected');
		option.querySelector('input').checked = false;
	});
	updateCustomControls();
}

function handleOverlayClick(event) {
	if (event.target === document.getElementById('customLayoutOverlay')) {
		cancelCustomLayout();
	}
}