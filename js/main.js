// main.js

//variable setting
var margin = {left:80, right:100, top:50, bottom:100},
	height = 500 - margin.top - margin.bottom, //graph height
	width = 800 - margin.right - margin.left; //graph width

//svg setting
var g = d3.select("#chart-area")
	.append("svg")
		.attr("width", width + margin.left + margin.right) //back to svg x
		.attr("height", height + margin.top + margin.bottom) //back to svg y
	.append("g")
		.attr("transform", "translate(" + margin.left + ", " + margin.top + ")");

var parseTime = d3.timeParse("%d/%m/%Y");
// var parseTime = d3.timeParse("%Y");
//for tooltip
var bisectDate = d3.bisector(d=>{return d.year;}).left;

//scales
var x = d3.scaleTime().range([0,width]);
var y = d3.scaleLinear().range([height,0]);

//axis generators
var xAxisCall = d3.axisBottom()
var yAxisCall = d3.axisLeft()
	.ticks(6)
	.tickFormat(d => {return parseInt(d/1000) + "k";});

//axis groups
var xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")");
var yAxis = g.append("g")
	.attr("class", "y axis")

//y axis label
yAxis.append("text")
	.attr("class", "axis title")
	.attr("transform", "rotate(-90)")
	.attr("y",10)
	.style("text-anchor","end")
	.attr("fill", "#5D6971")
	// .attr("dy",".5em")
	.text("Population");

//line path generator, this can be outside (why can be outside?)
var line = d3.line()
	.x(d=>{return x(d.year);})
	.y(d=>{return y(d.value);});

//load data
d3.json("data/coins.json").then(data=>{
	console.log(data);

	// //data cleaning
	// data.forEach(d=>{
	// 	d.year = parseTime(d.year);
	// 	d.value = +d.value;
	// });

	//prepare and clean data
	filteredData = {};
	for (var coin in data) {
		if (!data.hasOwnProperty(coin)) {
			continue; //if array does not has data, it returns true and continue for below manipulations to clean up
		}
		filteredData[coin] = data[coin].filter(d=>{ //if price_usd is not a null, filter by these
			return !(d["price_usd"] == null)
		});
		filteredData[coin].forEach(d=>{
			d['price_usd'] = +d["price_usd"];
			d['24h_vol'] = +d["24h_vol"];
			d['market_cap'] = +d["market_cap"];
			d['date'] = parseTime(d["date"]);
		});
	}

	console.log(filteredData['bitcoin']);

	//domain
	x.domain(d3.extent(data, d=>{return d.year; }));
    y.domain([d3.min(data, d=>{return d.value; }) / 1.005, 
        d3.max(data, d=>{return d.value; }) * 1.005]);
	
	//generate axis
	xAxis.call(xAxisCall.scale(x))
	yAxis.call(yAxisCall.scale(y))

	//add the line for the first time
	g.append("path")
		.attr("class", "line")
		.attr("fill", "none")
		.attr("stroke", "grey")
		.attr("stroke-width", "3px")
		.attr("d", line(data));

	/**********tooltip**********/
	var focus = g.append("g")
		.attr("class", "focus")
		.style("display", "none");
	focus.append("line")
		.attr("class","x-hover-line hover-line")
		.attr("y1",0)
		.attr("y2",height);
	focus.append("line")
		.attr("class","y-hover-line hover-line")
		.attr("x1",0)
		.attr("x2", width);
	focus.append("circle")
		.attr("r",6);
	focus.append("text")
		.attr("x",15);
	g.append("rect")
		.attr("class", "overlay")
		.attr("width", width)
		.attr("height",height)
		.on("mouseover",function(){focus.style("display",null);})
		.on("mouseout",function(){focus.style("display","none");})
		.on("mousemove",mousemove);
	
    function mousemove() {
        var x0 = x.invert(d3.mouse(this)[0]),
            i = bisectDate(data, x0, 1),
            d0 = data[i - 1],
            d1 = data[i],
            d = x0 - d0.year > d1.year - x0 ? d1 : d0;
        focus.attr("transform", "translate(" + x(d.year) + "," + y(d.value) + ")");
        focus.select("text").text(d.value);
        focus.select(".x-hover-line").attr("y2", height - y(d.value));
        focus.select(".y-hover-line").attr("x2", -x(d.year));
    }
	/**********tooltip**********/

});