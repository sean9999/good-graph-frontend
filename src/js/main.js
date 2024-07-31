import Graph from "./graph";
import { randomColor } from "./utils";

import * as dom from "./dom";

import soccer from "./websock";

const nodes = [];
const links = [];

const g = new Graph(dom.nodeGraph, nodes, links);
window.g = g;

const getNodeIdFromLink = (thing) => {
	if (typeof thing === "number") {
		return thing;
	} else {
		return thing.id;
	}
}

//	websockets
const marcoPoloMsg = {
	"msgType": "marcoPolo",
	"msg": "marco",
	"n": 0
};


//const ws = soccer.ws;
soccer.onMessage(message => {
	if (! "msgType" in message) {
		console.warn("malformed message", message);
	} else {
		switch (message.subject) {
			case "marcoPolo":
				if (message.msg == "marco") {
					marcoPoloMsg.msg = "polo";
				} else {
					marcoPoloMsg.msg = "marco";
				}
				marcoPoloMsg.n = message.n++;
				console.log(marcoPoloMsg);
				if (marcoPoloMsg.n < 100) {
					soccer.send(marcoPoloMsg.msgType, marcoPoloMsg.msg, marcoPoloMsg.n);
				}
				break;
			case "killYourself":
				soccer.ws.close();
				console.info("closing soccer");
				break;
			case "society/addNode":
				console.log("let's add a node!");
				break;
			case "mutation/peerAdded":
				g.addNode(message.peer.nick);
			default:
				console.warn(message);
		}
	}
});

setTimeout(() => {
	soccer.send("system", "websockets up");
}, 2222);

dom.btn.marco.addEventListener("click", _ => {
	soccer.send(marcoPoloMsg.msgType, marcoPoloMsg.msg, marcoPoloMsg.n);
});

dom.btn.killYourself.addEventListener("click", _ => {
	soccer.send("killYourself");
});

dom.btn.reconnect.addEventListener("click", _ => {
	soccer.reconnect();
});

dom.btn.debug.addEventListener("click", _ => {
	const prog = (g, lnks) => {
			g.eventPipe.push({"eventType": "emitParticle", "links": lnks});
			for (let lnk of lnks) {

				const snodeId = getNodeIdFromLink(lnk.source);
				const snode = g.registry.node.get(snodeId);
	
				if (snode.visited > 13) {
					return;
				}
				
				const vnodeId = getNodeIdFromLink(lnk.target);
				const vnode = g.registry.node.get(vnodeId);
	
				if (vnode.visited > 13) {
					return;
				}
	
				vnode.visited++;
	
				switch (vnode.visited) {
					case 0:
						vnode.color = 'black';
						break;
					case 1:
						vnode.color = 'red';
						break;
					case 2:
						vnode.color = "green";
						break;
					case 3:
						vnode.color = "purple";
						break;
					case 4:
						vnode.color = "yellow";
						break;
					default:
						vnode.color = "cyan";
						break;
				}
			
				g.updateNode(vnode);
				//g.layout.emitParticle(lnk);
				console.log(`${lnk.source.nickname}\t(${lnk.source.visited})\tvisitedt\t${lnk.target.nickname}\t(${lnk.target.visited})`);
				let nextLinks = g.registry.source.get(getNodeIdFromLink(lnk.target));
				nextLinks.forEach(thisLink => {
					const links = [];
					let targetNode = thisLink.target;
					if (typeof thisLink.target === "number") {
						targetNode = g.node.get(thisLink.target);
					}
					if (targetNode.visited < 13) {
							links.push(thisLink);						
					}
					prog(g, links);
				});

			}

	};
	//	emit chain
	prog(g, [g.randomLink()]);
});

dom.btn.addNode1.addEventListener("click", _ => {
	g.addNode(`Mr ${g.lastId()+1}`);
	g.addNode(`Mr ${g.lastId()+1}`);
});

dom.btn.addNode2.addEventListener("click", _ => {
	//console.log("hello")
	soccer.send("please/addNode", {}, 1);
});


dom.btn.lonely.addEventListener("click", _ => {
	const a = g.randomLonelyNode();
	if (a != null) {
		const b = g.randomNode(a.id);
		g.befriend(a,b);
	} else {
		console.warn("no more lonelies");
	}
});

dom.btn.emitPartices.addEventListener("click", _ => {

	let lnk1 = g.randomLink();
	let lnk2 = g.randomLink(lnk1.source);
	g.layout.emitParticle(lnk1);
	g.layout.emitParticle(lnk2);

	lnk1.source.color = randomColor();
	lnk1.target.color = randomColor();

	lnk2.source.color = randomColor();
	lnk2.target.color = randomColor();

	window.lnk1 = lnk1;
	window.lnk2 = lnk2;

});

btnEgalitarian.addEventListener('click', _ => {
	//	add nodes
	for (let i=0;i<200;i++) {
		g.addNode(`Mr ${g.lastId()+1}`);
	}
	//	connect the most needy nodes first
	//	stop when everyone has three friends
	let highscore = 0;
	while (highscore < 3) {
		let nodes = g.nodesByPopularity();
		let a = nodes[0];
		let a1 = g.registry.neigbours(a);
		let b = nodes.find(thisNode => {
			return (thisNode.id != a.id) && !a1.includes(thisNode.id);
		});
		if (b !== undefined) {
			g.follow(a, b);
		}
		highscore = a.score;
	}

	//	now every node connects to a random stranger
	//	that stranger cannot become too popular
	g.nodes.forEach(thisNode => {
		const myNeighbours = g.neighbours(thisNode);
		const stranger = nodes.find(thatNode => {
			return (thisNode.id !== thatNode.id) && !myNeighbours.includes(thatNode.id) && thatNode.score < 5;
		});
		g.follow(thisNode, stranger);
	});

});

dom.btn.hier.addEventListener("click", _ => {
	//	a king is selected
	const king = g.addNode(`King ${g.lastId()+1}`);
	king.type = "king";
	king.color = "blue";

	//	5 lieutenant are selected
	//	each one is freinds with the king
	const l1 = g.addNode(`Lt ${g.lastId()+1}`);
	l1.type = "lieutenant";
	l1.color = "red";
	const l2 = g.addNode(`Lt ${g.lastId()+1}`);
	l2.type = "lieutenant";
	l2.color = "red";
	const l3 = g.addNode(`Lt ${g.lastId()+1}`);
	l3.type = "lieutenant";
	l3.color = "red";
	const l4 = g.addNode(`Lt ${g.lastId()+1}`);
	l4.type = "lieutenant";
	l4.color = "red";
	const l5 = g.addNode(`Lt ${g.lastId()+1}`);
	l5.type = "lieutenant";
	l5.color = "red";
	g.follow(l1, king);
	g.follow(l2, king);
	g.follow(l3, king);
	g.follow(l4, king);
	g.follow(l5, king);

	//	all commoners know one lietenant
	[l1,l2,l3,l4,l5].forEach(leu => {
		for (let i=0;i<20;i++) {
			let node = g.addNode(`Cm ${g.lastId()}`);
			node.type = "commoner";
			node.color = "black";
			g.follow(node, leu);
		}
	});

	window.setTimeout(() => {
	//	every commoner knows one commoner from another district
	g.nodes.filter(n => n.type == "commoner").forEach(commoner => {
		const neighbours = g.neighbours(commoner);
		let rand = g.randomNode();
		while (rand.type !== "commoner" && neighbours.includes(rand.id)) {
			rand = g.randomNode();
		}
		g.follow(commoner, rand);
	});

	}, 500);
});

