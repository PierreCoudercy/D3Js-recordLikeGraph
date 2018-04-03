var width = 1800,
    height = 700,
    radius = 30;

var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

//Function used to draw curved link to changer the curve() parameter check online for the options
var diagonal = d3.line().curve(d3.curveBundle).x(function(d){return d.x}).y(function(d){return d.y});

//Loop to read the data contained in graphFile.json
d3.json("graphFile.json", function(error, graph) {
    if (error) throw error;
    cpt = 0;
    index_parent = {};
    
    idIN  = 0;
    yIN	  = 0;
    idOUT = 0;
    yOUT  = 0;

    //Loop to generate position and size of each node
    graph.nodes.forEach(function(d){
	if(d.parent == "None"){
	    //Statement to calculate width and height of the parents node
	    num_child_in = 0;
	    num_child_out = 0;
	    id = d.group;
	    
	    for (n in graph.nodes){
		if (graph.nodes[n].parent == id && (graph.nodes[n].pos == "pCI" || graph.nodes[n].pos == "pO")){
		    num_child_in++;
		}
		if (graph.nodes[n].parent == id && (graph.nodes[n].pos == "pCO" || graph.nodes[n].pos == "pI")){
		    num_child_out++;
		}
	    }
	    
	    if(d.pos=="center"){
		d["w"] = 8*radius+6*radius;
	    }
	    else{
		d["w"] = 4*radius+6*radius;
	    }
	    d["h"] = Math.max(num_child_in,num_child_out)*radius;
	    //Calculate the  position of the parent node
	    if(d.pos == "center"){
		d["x"] = width/2-d.w/2;
		d["y"] = height/2;
	    }
	    else if(d.pos == "in"){
		d["x"] = radius;
		if(yIN == 0){
		    d["y"] = height/2;
		    idIN++;
		    yIN++;
		}
		else{
		    d["y"] = height/2+(yIN+2*d.h)*Math.pow(-1,idIN);
		    if(idIN%2==0){
			yIN++;
		    }
		    idIN++;
		}
	    }
	    else{
		d["x"] = width-d.w-radius;
		if(yOUT == 0){
		    d["y"] = height/2;
		    idOUT++;
		    yOUT++;
		}
		else{
		    d["y"] = height/2+(yOUT+2*d.h)*Math.pow(-1,idOUT);
		    if(idOUT%2==0){
			yOUT++;
		    }
		}
		
	    }
	    
	    index_parent[id] = [cpt,0,0];
	}
	else{
	    //Calculate position of child node depending on its parent
	    if(d.pos == "pCI" || d.pos == "pO"){
		d["x"] = graph.nodes[index_parent[d.parent][0]].x;
		d["y"] = graph.nodes[index_parent[d.parent][0]].y+index_parent[d.parent][1]*radius;
		index_parent[d.parent][1]++;
	    }
	    if(d.pos == "pCO" || d.pos == "pI"){
		d["x"] = graph.nodes[index_parent[d.parent][0]].x+graph.nodes[index_parent[d.parent][0]].w-radius*4;
		d["y"] = graph.nodes[index_parent[d.parent][0]].y+index_parent[d.parent][2]*radius;
		index_parent[d.parent][2]++;
	    }
	    d["w"] = 4*radius;
	    d["h"] = radius;
	}
	cpt++;
    });

    //Add information to links data this allow to control the coloration of links
    dictLinksId = {};
    graph.links.forEach(function(d) {
	d.source = graph.nodes[d.source];
	d.target = graph.nodes[d.target];
	if(d.target.pos=="pCI"){
	    d["class"] = "in";
	}
	else{
	    d["class"] = "out";
	}
	if (dictLinksId[d.source.label+d.source.label]){
	    d["id"] = d.source.label+d.target.label+dictLinksId[d.source.label+d.source.label];
	    dictLinksId[d.source.label+d.source.label]++;
	}
	else{
	    d["id"] = d.source.label+d.target.label;
	    dictLinksId[d.source.label+d.target.label]=1;
	}
    });
    //Generate arrowhead
    svg.append("svg:defs").selectAll("marker").data(["in","out"])
	.enter().append("svg:marker")
	.attr("id", String)
	.attr("refX", 12)
	.attr("refY", 6)
	.attr("markerWidth", 30)
	.attr("markerHeight", 30)
	.attr("orient", "auto")
	.append("path")
	.attr("d", "M 0 0 12 6 0 12 3 6");
    //generate links and add arrowhead on links
    var link = svg.append("g")
	.attr("class", "link")
	.selectAll("path")
	.data(graph.links)
	.enter().append("path")
	.attr("id",function(d){return d.id;})
	.attr("class",function(d) { return d.class; })
	.attr("d", function(d) {
	    //function to generate the path of the link (curved)
	    //if you want straight line leave only the first and last dictionnary in the path variable
	    x1 = d.source.x+d.source.w;
	    y1 = d.source.y+d.source.h/2;
	    x2 = d.target.x;
	    y2 = d.target.y+d.target.h/2;
	    if(d.class=="in"){
		dx = (x2+x1)/8;
	    }
	    else{
		dx = (x2+x1)/16;
	    }
	    path = [{"x":x1,"y":y1},{"x":x1+dx,"y":y1},{"x":x2-dx,"y":y2},{"x":x2,"y":y2}];
	    return diagonal(path);
	})
	.attr("marker-end", function(d){if(d.target.pos=="pCI"){return "url(#in)";}else if(d.target.pos=="pO"){return "url(#out)";}});

    //generate nodes and add drag function
    var node = svg.append("g")
	.attr("class", "node")
	.selectAll("rect")
	.data(graph.nodes)
	.enter().append("rect")
	.attr("class", function(d){return d.pos+" "+d.group;})
	.attr("width", function(d){return d.w;})
	.attr("height", function(d){return d.h;})
	.attr("x", function(d) { return d.x; })
	.attr("y", function(d) { return d.y; })
	.call(d3.drag().on("drag", dragged));

    //add label to nodes
    var label = svg.append("g")
	.attr("class","label")
	.selectAll(".label")
	.data(graph.nodes)
	.enter().append("text")
	.attr("x",function(d){if(d.pos=="in"){return d.x+d.w/4*1.2;}else if(d.pos=="out"){return d.x+d.w/4*2.8;}else{return d.x+d.w/2;}})	
	.attr("y",function(d){return d.y+d.h/5*3;})
	.attr("text-anchor", "middle")
	.text(function(d){return d.label;});

    //add label on links to indicates the weight of the link
    var weightLabel = svg.append("g")
	.attr("class","weightLabel")
	.selectAll(".weightLabel")
	.data(graph.links).enter()
	.append("text")
	.attr("y",-4)
	.append("textPath")
	.attr("xlink:href", function(d){return "#"+d.id;})
	.attr("text-anchor", "middle")
	.attr("startOffset", "50%")
	.text(function(d){return d.w;});
    
    function dragged(d) {
	nudge(d3.select(this).attr("class").split(" ")[1],d3.event.dx, d3.event.dy);
    }
    //Take care of moving a group of node and not only one node
    function nudge(group,dx, dy) {
	//move all node with the same group as the group of the selected node
	node.filter(function(d) { if(d.group==group){ return d; }})
	    .attr("x", function(d) { return d.x += dx; })
	    .attr("y", function(d) { return d.y += dy; })
	//do the same with the label
	label.filter(function(d) { if(d.group==group){ return d; }})
	    .attr("x", function(d) { if(d.pos=="in"){return d.x+d.w/4*1.2;}else if(d.pos=="out"){return d.x+d.w/4*2.8;}else{return d.x+d.w/2; }})
	    .attr("y", function(d) { return d.y+d.h/5*3; })
	//and the links of course this one is for source node for the link
	link.filter(function(d) { if(d.source.group==group){ return d; }})
	    .attr("d",function(d){
		x1 = d.source.x+d.source.w;
		y1 = d.source.y+d.source.h/2;
		x2 = d.target.x;
		y2 = d.target.y+d.target.h/2;
		if(d.class=="in"){
		    dx = (x2+x1)/8;
		}
		else{
		    dx = (x2+x1)/16;
		}
		path = [{"x":x1,"y":y1},{"x":x1+dx,"y":y1},{"x":x2-dx,"y":y2},{"x":x2,"y":y2}];
		return diagonal(path);
	    });
	//this one is for the target node of the link
	link.filter(function(d) {if(d.target.group==group){ return d; }})
	    .attr("d",function(d){
		x1 = d.source.x+d.source.w;
		y1 = d.source.y+d.source.h/2;
		x2 = d.target.x;
		y2 = d.target.y+d.target.h/2;
		if(d.class=="in"){
		    dx = (x2+x1)/8;
		}
		else{
		    dx = (x2+x1)/16;
		}
		path = [{"x":x1,"y":y1},{"x":x1+dx,"y":y1},{"x":x2-dx,"y":y2},{"x":x2,"y":y2}];
		return diagonal(path);
	    });
    }
});
