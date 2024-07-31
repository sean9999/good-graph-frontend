function randomColor() {
	const genRanHex = size => [...Array(size)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
	return '#' + genRanHex(6);
}

function randomGroup() {
	const groups = ["a", "b", "c", "d"];
	return groups[Math.floor(Math.random() * groups.length)];
}

function deepEqual(a, b) {
	return (a.source == b.source) && (a.target == b.target);
}

export { deepEqual, randomColor, randomGroup };
