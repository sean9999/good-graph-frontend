import ForceGraph from 'force-graph';
import Registry from "./registry";

// function nodePaint({ id, x, y }, color, ctx) {
// 	ctx.fillStyle = color;
// 	[
// 	  () => { ctx.fillRect(x - 6, y - 4, 12, 8); }, // rectangle
// 	  () => { ctx.beginPath(); ctx.moveTo(x, y - 5); ctx.lineTo(x - 5, y + 5); ctx.lineTo(x + 5, y + 5); ctx.fill(); }, // triangle
// 	  () => { ctx.beginPath(); ctx.arc(x, y, 5, 0, 2 * Math.PI, false); ctx.fill(); }, // circle
// 	  () => { ctx.font = '10px Sans-Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Text', x, y); } // text
// 	][id%4]();
// }

//	Graph is a class that handles both data structures and layout for a directed acyclic graph (DAG)
class Graph{
	layout;
	registry;
	nodes;
	links;
	globalId;
	eventPipe;
	constructor(domNode, nodes, links) {
		//	data
		this.globalId = 0;
		this.nodes = nodes;
		this.links = links;
		this.registry = new Registry(nodes, links);
		//	layout
		this.eventPipe = [];
		const layout = ForceGraph();
		layout(domNode).graphData({
			nodes: this.nodes,
			links: this.links
		});
		layout.d3Force('center', null);
		layout.linkCurvature('curvature');
		layout.cooldownTicks(50);
		layout.nodeRelSize(6);
		layout.nodeLabel(n => n.label);
		layout.nodeAutoColorBy('group');
		//layout.d3AlphaDecay(0.0400);
		//layout.d3VelocityDecay(0.3);


		layout.nodeCanvasObject((node, ctx, globalScale) => {
			const label = node.label;
			const fontSize = 12/globalScale;
			
			const textWidth = ctx.measureText(label).width;
			const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); // some padding
  
			ctx.beginPath(); 
			ctx.arc(node.x, node.y, 5, 0, 2 * Math.PI, false); 
			ctx.fillStyle = node.color;
			ctx.fill();

			ctx.font = `${fontSize}px Sans-Serif`;
			ctx.fillStyle = 'rgba(255,255,100,0.5)';
			ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
  
			//ctx.strokeStyle = '#AAA';
			//ctx.stroke();

			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillStyle = 'black';
			//ctx.strokeStyle = 'red';
			//ctx.stroke();

			ctx.fillText(label, node.x, node.y);
  
			node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
		  });

		  layout.nodePointerAreaPaint((node, color, ctx) => {
			ctx.fillStyle = color;
			const bckgDimensions = node.__bckgDimensions;
			bckgDimensions && ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
		  });

		layout.linkDirectionalParticleWidth(7);
		layout.d3ReheatSimulation();
		layout.onNodeClick(ev => {
			console.log("node click", ev);
		});
        layout.linkDirectionalArrowLength(3);
        layout.linkDirectionalArrowRelPos(1);
		
		layout.onRenderFramePost(_ => {
			console.log(this.eventPipe.length);
			if (this.eventPipe.length) {
				const ev = this.eventPipe.pop();
				for (let lnk of ev.links) {
					layout.emitParticle(lnk);
				}	
			}
		});
		
		layout.onEngineStop(_ => {
			layout.zoomToFit(250, 100);
		});
		this.layout = layout;
	}
	lastId() {
		return this.globalId;
	}
	nextId() {
		this.globalId++;
		return this.globalId;
	}
	addNode(nickname) {
		const id = this.nextId();
		let color = "gray";
		let node = {
			color,
			id,
			nickname,
			label: nickname,
			visited: 0
		};
		this.registerNode(node);
		this.repaint();
		return node;
	}
	registerNode(node) {
		//this.nodes.push(node);
		this.registry.addNode(node);
	}
	registerLink(lnk) {
		this.registry.addLink(lnk);
	}
	updateNode(node) {
		this.registry.updateNode(node)
		this.repaint();
	}
	befriend(node1, node2) {
		this.follow(node1, node2);
		this.follow(node2, node1);
	}
	follow(node1, node2) {
		if (node1 === undefined) {
			console.error("node1 was undfined");
		} else if (node2 === undefined) {
			console.error("node2 was undfined");
		} else {
			this.addLink(node1.id, node2.id);
		}
	}
	addLink(source, target) {
		const link = {source, target};
		this.links.push(link);
		
		if (typeof link.source === "number") {
			this.registry.node.get(link.source).score++;
		} else {
			link.source.score++;
		}

		if (typeof link.target === "number") {
			this.registry.node.get(link.target).score++;
		} else {
			link.target.score++;
		}

		this.registry.addLink(link);
		this.repaint();
		return link;
	}
	randomNode(notId = -1) {
		let node = null;
		let id = notId;
		while (id == notId || node == null) {
			node = this.nodes[Math.floor(Math.random()*this.nodes.length)];
			if (node !== null) {
				id = node.id;
			}
		}
		return node;
	}
	lonelyNodes() {
		const lonelies = this.nodesByPopularity().filter(node => {
			return (node.score == 0);
		});
		return lonelies;
	}
	nodesByPopularity(ascending = true) {
		const nodes = this.data().nodes.map(node => {
			node.score = this.registry.target.get(node.id).length + this.registry.source.get(node.id).length; 
			return node;
		});
		nodes.sort((a, b) => {
			if (ascending) {
				return a.score - b.score;
			} else {
				return b.score - a.score;
			}
		});
		return nodes;
	}
	randomLonelyNode() {
		let r;
		let lonelies = this.lonelyNodes();
		if (lonelies.length > 0) {
			r = lonelies[Math.floor(Math.random()*lonelies.length)];
		}
		//console.log("random lonely node", r);
		return r;
	}
	randomLink(sourceNot = -1) {
		let src = sourceNot;
		let lnk;
		while (src == sourceNot || lnk == null || lnk == undefined) {
			lnk = this.links[Math.floor(Math.random()*this.links.length)];
			if (lnk) {
				src = lnk.source;
			}
		}
		return lnk;
	}
	data() {
		return {
			nodes: this.nodes,
			links: this.links
		};
	}
	neighbours(node) {
		return this.registry.neigbours(node);
	}
	repaint() {
		const gData = this.data();
		let selfLoopLinks = {};
		let sameNodesLinks = {};
		const curvatureMinMax = 0.333;
	
		const getLinkId = (thing) => {
			if (typeof thing === "number") {
				return thing;
			} else {
				return thing.id;
			}
		}

		// 1. assign each link a nodePairId that combines their source and target independent of the links direction
		// 2. group links together that share the same two nodes or are self-loops
		gData.links.forEach(link => {


			link.nodePairId = getLinkId(link.source) <= getLinkId(link.target) ? (getLinkId(link.source) + "_" + getLinkId(link.target)) : (getLinkId(link.target) + "_" + getLinkId(link.source));
			let map = getLinkId(link.source) === getLinkId(link.target) ? selfLoopLinks : sameNodesLinks;
			if (!map[link.nodePairId]) {
				map[link.nodePairId] = [];
			}
			map[link.nodePairId].push(link);
		});
	
		// Compute the curvature for self-loop links to avoid overlaps
		Object.keys(selfLoopLinks).forEach(id => {
			let links = selfLoopLinks[id];
			let lastIndex = links.length - 1;
			links[lastIndex].curvature = 1;
			let delta = (1 - curvatureMinMax) / lastIndex;
			for (let i = 0; i < lastIndex; i++) {
				links[i].curvature = curvatureMinMax + i * delta;
			}
		});
	
		// Compute the curvature for links sharing the same two nodes to avoid overlaps
		Object.keys(sameNodesLinks).filter(nodePairId => sameNodesLinks[nodePairId].length > 1).forEach(nodePairId => {
			let links = sameNodesLinks[nodePairId];
			let lastIndex = links.length - 1;
			let lastLink = links[lastIndex];
			lastLink.curvature = curvatureMinMax;
			let delta = 2 * curvatureMinMax / lastIndex;
			for (let i = 0; i < lastIndex; i++) {
				links[i].curvature = - curvatureMinMax + i * delta;
				if (lastLink.source !== links[i].source) {
					links[i].curvature *= -1; // flip it around, otherwise they overlap
				}
			}
		});

		this.layout.graphData(gData);
	}
}

export default Graph;