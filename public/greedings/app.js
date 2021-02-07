let retryCounter = 0;
function connect() {
	let ws = new WebSocket('ws://localhost:8090');

	ws.addEventListener('error', (e) => {
		console.error('error:', e);
		if (retryCounter < 5) {
			setTimeout(() => {
				connect();
			}, 2000);
		}
	});
	ws.addEventListener('open', (e) => {
		console.log('socket open');
		retryCounter = 0;
	});
	ws.addEventListener('close', (e) => {
		console.log('socket closed');
		setTimeout(() => {
			connect();
		}, 2000);
	});
	
	ws.addEventListener('message', (e) => {
		const data = JSON.parse(e.data);
		createGreeding(data);
	});
}

connect();


function createGreeding(data) {
	const container = document.createElement('div');
	container.classList.add('greeding', 'hidden');

	const emote =document.createElement('img');
	emote.setAttribute('src', 'https://static-cdn.jtvnw.net/emoticons/v2/303232723/default/dark/3.0')

	const greeding =document.createElement('span');
	greeding.textContent = data.message;
	greeding.style.color = data.color;

	container.appendChild(emote);
	container.appendChild(document.createElement('br'));
	container.appendChild(greeding);
	document.body.appendChild(container);

	const center = (window.innerWidth / 2) - (container.getBoundingClientRect().width / 2);
	const startX = getRandom(center - (center/20), center + (center/20));

	container.style.left = startX + 'px'
	container.style.top = window.innerHeight + 'px';

	move(container, 
		{
			x: startX,
			y: window.innerHeight
		},
		{
			x: getRandom(-3, 3),
			y: getRandom(8, 12)
		});
	
	setTimeout(() => {
		container.classList.remove('hidden');
	}, 1000);

	setTimeout(() => {
		container.classList.add('hidden');
		setTimeout(() => {
			container.remove();
		}, 1000);
	}, getRandom(6, 8) * 1000);
}



function move(element, position, vector) {
	if (document.body.contains(element)) {
		let newPos = position;
		let newVec = vector;
		newPos.x += vector.x;
		newPos.y -= vector.y;
		element.style.left = newPos.x + 'px';
		element.style.top = newPos.y + 'px';
		newVec.y = newVec.y - (0.04 + (newVec.y / 500));
		setTimeout(() => {
			move(element, newPos, newVec);
		}, 10);
	}
}


function getRandom(min, max) {
    return (Math.random() * (max - min + 1)) + min;
}