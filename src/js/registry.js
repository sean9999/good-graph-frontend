//	SliceMap is like a Map, with these differences:
//	- get returs an empty array instead of undefined for keys that don't yet exist
//	- set always merges the value with the existing value, using Array.concat()
//	- a new method called remove() is neccessary, because delete would erase all values at the key.
//	- delete instead removes a specific value at the key, leaving the rest untouched.
class SliceMap extends Map{
	constructor(){
		super();
	}
	get(key) {
		//	get always returns an array.
		return super.get(key) || [];
	}
	set(key, val) {
		//	set always pushes to array. 
		super.set(key, this.get(key).concat(val));
	}
	includes(key, val) {
		//	does val exist in the array at key?
		return this.get(key).includes(val);
	}
	remove(key, val) {
		//	remove the value from key, leaving everything else
		const vals = this.get(key).filter(v => {
			return (v != val);
		});
		this.set(key, vals);
	}
}

const getLinkId = (thing) => {
	if (typeof thing === "number") {
		return thing;
	} else {
		return thing.id;
	}
}

//	Registry contains all the data access mechanics for nodes and links
class Registry{
	target;
	source;
	node;
	nodes;
	links;
	//nodeIndex;
	//linkIndexSource;
	//linkIndexTarget;
	constructor(nodes, links){
		this.target = new SliceMap();
		this.source = new SliceMap();
		this.node = new Map();
		this.nodes = nodes;
		this.links = links;
		nodes.forEach(node => {
			this.node.set(node.id, node);
		});
		links.forEach(lnk => {
			this.target.set(lnk.target.id, lnk);
			this.source.set(lnk.source.id, lnk);
		});
	}
	data() {
		return {
			nodes: this.nodes,
			links: this.links
		}
	}
	walk(node) {
		return node.outLinks.map(lnk => lnk.target);
	}
	neigbours(node) {
		const nodeIds = [];
		this.target.get(node.id).forEach(lnk => {
			nodeIds.push(
				lnk.source.id
			);
		});
		this.source.get(node.id).forEach(lnk => {
			nodeIds.push(
				lnk.target.id
			);
		});
		let nodes = nodeIds.filter((id, i) => {
			//	filter out self
			if (id == node.id) {
				return false;
			}
			//	filter out duplicates
			return (i === nodeIds.lastIndexOf(id));
		}).map(id => {
			return this.node.get(id);
		});
		return nodes;
	}
	outLinks(node) {
		return this.source.get(node.id);
	}
	inLinks(node) {
		return this.target.get(node.id);
	}
	addNode(node) {
		//let i = this.nodes.length;
		//node.i = i;
		this.nodes.push(node);
		this.node.set(node.id, node);
	}
	getLinks(node) {
		/*
		const links = new Set();
		this.target.get(node.id).forEach(lnk => {
			if (!links.has(lnk)){
				links.add(lnk);
			}
		});
		this.source.get(node.id).forEach(lnk => {
			if (!links.has(lnk)){
				links.add(lnk);
			}
		});
		return Array.from(links);
		*/
		return this.inLinks(node).concat(this.outLinks(node));
	}
	removeNode(node) {
		let i = node.index;
		let id = node.id;
		this.node.delete(id);
		this.getLinks(node).forEach(lnk => {
			this.removeLink(lnk);
		});
		this.nodes[i] = null;
	}
	updateNode(node) {
		//	@todo: i wonder if both these statements are necessary, or just one
		this.node.set(node.id, node);
		this.nodes[node.index] = node;
	}
	addLink(lnk) {
		this.target.set(getLinkId(lnk.target), lnk);
		this.source.set(getLinkId(lnk.source), lnk);
	}
	removeLink(lnk) {
		const i = lnk.index;
		this.target.remove(getLinkId(lnk.target), lnk);
		this.source.remove(getLinkId(lnk.source), lnk);
		this.links[i] = null;
	}
}

export default Registry;
export { SliceMap };
