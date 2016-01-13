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


var chartFactory = (function() {
  "use strict";

  function determine_x_extent(data) {
    return data.map(function(el) { return el.key; });
  }


  /**
   * Linegraph mixin
   */
  function linegraph(proto) {

    var x_min = d3.min(data.map(function(ds) { return ds.values; }),
        function(d1) { return d3.min(d1, function(d2) { return d2.x; }); })
    var x_max = d3.max(data.map(function(ds) { return ds.values; }),
        function(d1) { return d3.max(d1, function(d2) { return d2.x; }); });
    proto._x = d3.scale.linear()
      .domain([x_min,x_max])
      .range([this.margin(),this.width()-this.margin()])

    this.setup_axes();

    proto.line = d3.svg.line()
      .x(function(el) { return this._x(el.x); })
      .y(function(el) { return this._y(el.y); });
    this.colors.domain(this.data.map(function(el) { return el.key; }));

    proto.all_paths = _svg.selectAll('path.data')
      .data(data)
      .enter()
      .append('path')
      .attr({
        d: function(d) { 
          return line(d.values); 
          },
        class: function(d) { return 'data ' + d.key; },
        stroke: function(d) { return colors(d.key); }
      });

    return this;
  };

  return function chart() {
    var _svg,
        _width = 300, 
        _height = 200,
        _margin = 30,
        _xAxis = null,
        _yAxis = null,
        colors = d3.scale.category10();

    var o = Object.create({});

    o.init = function (sel) {
      _svg = d3.select(sel)
        .append('svg')
        .attr({
          width: _width,
          height: _height
        });
      return this;
    }

    o.height = function(val) {
      if (val === undefined)
        return _height;
      _height = val;
      return this;
    }

    o.width = function(val) {
      if (val === undefined) return _width;
      _width = val;
      return this;
    }

    o.margin = function(val) {
      if (val === undefined ) return _margin;
      _margin = val;
      return this;
    }

    o.colors = function(val) {
      if (val === undefined) return _colors;
      _colors = val;
      return this;
    }

    o.setup_scales = function(values) {
      var x_domain = determine_x_extent(values)
      if (typeof x_domain[0] !== 'string') {

      } else {
        _x = d3.scale.ordinal()
          .domain(x_domain)
          .rangePoints([_margin,_width-_margin],1.0);
      }

      _y = d3.scale.linear()
        .domain([0,30])
        .range([_height-_margin,_margin]);
    }

    o.setup_axes = function() {
      _xAxis = d3.svg.axis()
        .scale(this._x)
        .orient('bottom');
      _svg.append('g')
        .attr({
          class: 'axis x-axis',
          transform: 'translate(0,' + (this.height() - this.margin()) + ')'
        })
        .call(_xAxis);

      _yAxis = d3.svg.axis()
        .scale(_y)
        .orient('left'); 
      _svg.append('g')
        .attr({
          class: 'axis y-axis',
          transform: 'translate(' + _margin + ',0)'
        })
        .call(_yAxis);
    }

    function bargraph(data) {
      var barwidth = 20;

      setup_scales(data);
      setup_axes();

      _svg.selectAll('rect.data')
        .data(data_bar)
        .enter()
        .append('rect')
        .attr({
          class: function(d) { return 'data ' + d.key; },
          x: function(d) { return _x(d.key) - barwidth/2; },
          y: function(d) { return _y(d.values); },
          width: barwidth,
          height: function(d) { return _y(0) - _y(d.values); },
          fill: function(d) { return colors(d.key); }
        });

      return this;
    }

    o.plot = function(data) {
      this.data = data;
      linegraph.call(this,Object.getPrototypeOf(this));
    }

    return o;
  }
})();

var lgraph = chartFactory()
  .width(300)
  .init('#line')
  .plot(data);

var bgraph = chartFactory()
  .width(250)
  .init('#bar')

highlighter('.data',data.map(function(el) { return el.key; }));

