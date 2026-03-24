// Apply static poster images on iPhone only (canvas thumbnail generation blocked by iOS)
if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
	const POSTERS = {
		video1:  'logos/Al-Manar.png',
		video2:  'logos/Al-Aqsa.png',
		video3:  'logos/Al_Mayadeen.png',
		video4:  'logos/al-arabiya.png',
		video5:  'logos/Al Jazeera.png',
		video6:  'logos/Al Jazeera.png',
		video7:  'logos/Al Hadath.png',
		video8:  'logos/Palestine Today.png',
		video9:  'logos/Palestine Mubasher.png',
		video10: 'logos/Palestine Satelite channel.png',
		video11: 'logos/jordan_tv.png',
		video12: 'logos/Voice of Lebanon.png',
		video13: 'logos/Syria TV.png',
		video14: 'logos/Al Masirah.png',
		//video15: 'logos/al-quds.png',
		video16: 'logos/Channel 11.png',
		video17: 'logos/Channel 12.png',
		video18: 'logos/Channel 13.png',
		video19: 'logos/Channel 14.png',
		video20: 'logos/i24News.png',
		video21: 'logos/CNN.png',
		video22: 'logos/FOX News.png',
		video23: 'logos/LiveNOW from FOX.png',
		video24: 'logos/NBC News.png',
		video25: 'logos/ABC News.png',
		video26: 'logos/CBS News.png',
		video27: 'logos/News12 New York.png',
		video28: 'logos/Iran-e-Farda TV.png',
		video29: 'logos/Iran International.png',
		video30: 'logos/Press TV.png',
		video31: 'logos/BBC.png',
		video32: 'logos/Sky News.png',
		video33: 'logos/Global News.png',
		video34: 'logos/RT.png',
	};
	for (const [id, poster] of Object.entries(POSTERS)) {
		const el = document.getElementById(id);
		if (!el) continue;
		const container = el.closest('.video-container');
		if (!container) continue;
		const header = container.querySelector('.video-header');
		const headerH = header ? header.offsetHeight : 0;
		const img = document.createElement('img');
		img.src = poster;
		img.style.cssText = `position:absolute;top:${headerH}px;left:0;width:100%;height:calc(100% - ${headerH}px);object-fit:fill;z-index:5;pointer-events:none;display:block;`;
		container.appendChild(img);
		el.addEventListener('play', () => { img.remove(); }, { once: true });
	}
}
