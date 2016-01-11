"use strict";

var data = d3.nest()
  .key(function(el) {return el.lab;})
  .entries([
    {x: 1, y: 10, lab: 'a' },
    {x: 2, y: 20, lab: 'a' },
    {x: 3, y: 15, lab: 'a' },
    {x: 4, y: 21, lab: 'a' },
    {x: 1, y: 12, lab: 'b' },
    {x: 2, y: 13, lab: 'b' },
    {x: 3, y: 17, lab: 'b' },
    {x: 1, y: 1, lab: 'c' },
    {x: 2, y: 24, lab: 'c' },
    {x: 3, y: 9, lab: 'c' },
    {x: 4, y: 28, lab: 'c' }
  ]);

var data_bar = data.map(function(el) {
  return { 
    key: el.key, 
    values: d3.sum(el.values, 
      function(d) {
        return d.y
      })
    };
});

var highlighter = function(selector,keys) {
  "use strict";
  var items = d3.selectAll(selector);
  items
      .on('mouseover', function(d) {
        // hide
        items
          .filter(function(d2) { return d2.key !== d.key; })
          .classed('shade', true);
        // highlight 
        items
          .filter(function(d2) { return d2.key === d.key; })
          .classed('highlight', true);
      })
      .on('mouseout', function(d) {
        // unclass
        items
          .classed({'shade': false, 'highlight': false });
      });
};

var plotAxis = function(sel) {
};


var graphFactory = (function() {
  var svg,
      _width = 300, 
      _height = 200,
      margin = 30,
      colors = d3.scale.category10();

  function init(sel) {
    svg = d3.select(sel)
      .append('svg')
      .attr({
        width: _width,
        height: _height
      });
    return this;
  }

  function height(val) {
    if (val === undefined)
      return _height;
    _height = val;
    return this;
  }

  function width(val) {
    if (val === undefined) return _width;
    _width = val;
    return this;
  }

  function linegraph(data) {

    var x = d3.scale.linear()
      .domain([0,5])
      .range([margin,width-margin])
    var y = d3.scale.linear()
      .domain([0,30])
      .range([height-margin,margin]);
    var line = d3.svg.line()
      .x(function(el) { return x(el.x); })
      .y(function(el) { return y(el.y); });
    colors.domain(data.map(function(el) { return el.key; }));

    var all_paths = svg.selectAll('path.data')
      .data(data)
      .enter()
      .append('path')
      .attr({
        d: function(d) { return line(d.values); },
        class: function(d) { return 'data ' + d.key; },
        stroke: function(d) { return colors(d.key); }
      });

    return this;
  };

  function bargraph(sel) {
    var barwidth = 20;
    var svg = d3.select(sel)
      .append('svg')
      .attr({
        width: width, height: height
      });
    var x = d3.scale.ordinal()
      .domain(data_bar.map(function(e) { return e.key; }))
      .rangePoints([margin,width-margin],1.0);
    var y = d3.scale.linear()
      .domain([0,d3.max(data_bar, function(d) {
        return d.values;
      })])
      .range([height-margin,margin]);
    svg.selectAll('rect.data')
      .data(data_bar)
      .enter()
      .append('rect')
      .attr({
        class: function(d) { return 'data ' + d.key; },
        x: function(d) { return x(d.key) - barwidth/2; },
        y: function(d) { return y(d.values); },
        width: barwidth,
        height: function(d) { return y(0) - y(d.values); },
        fill: function(d) { return colors(d.key); }
      });

    return this;
  }

  return function () {
    return Object.create({
        height: height,
        width: width,
        init: init,
        linegraph: linegraph,
        bargraph: bargraph
      });
  }
})();

var lgraph = graphFactory()
  .width(500)
  .init('#line')
  .linegraph(data);

highlighter('.data',data.map(function(el) { return el.key; }));

