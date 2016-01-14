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

  /**
   * Linegraph mixin
   * @return {object} the chart object with the linegraph properties and
   *    methods added to the objects' prototype.
   */
  function linegraph() {
    var proto = Object.getPrototypeOf(this),
        that = this;

    var x_min = d3.min(data.map(function(ds) { return ds.values; }),
        function(d1) { return d3.min(d1, function(d2) { return d2.x; }); })
    var x_max = d3.max(data.map(function(ds) { return ds.values; }),
        function(d1) { return d3.max(d1, function(d2) { return d2.x; }); });

    proto._x = d3.scale.linear()
      .domain([x_min,x_max])
      .range([this.margin(),this.width()-this.margin()])
    proto._y = d3.scale.linear()
        .domain([0,30])
        .range([this.height()-this.margin(),this.margin()]);

    this.setup_axes();

    proto.line = d3.svg.line()
      .x(function(el) { return that._x(el.x); })
      .y(function(el) { return that._y(el.y); });
    this.colors().domain(this.data.map(function(el) { return el.key; }));

    proto.all_paths = this._svg.selectAll('path.data')
      .data(data)
      .enter()
      .append('path')
      .attr({
        d: function(d) { 
          return proto.line(d.values); 
          },
        class: function(d) { return 'data ' + d.key; },
        stroke: function(d) { return that.colors()(d.key); }
      });

    return this;
  };

  /**
   * bargraph mixin
   * 
   */
  function bargraph() {
    var proto = Object.getPrototypeOf(this),
        that = this;

    var _barwidth = 20;
    proto.barwidth = function(value) {
      if (val === undefined) return _barwidth;
      _barwidth = value;
      return that;
    }

    proto._x = d3.scale.ordinal()
          .domain(this.data.map(function(d) { return d.key; }))
          .rangePoints([this.margin(),this.width()-this.margin()],1.0);
    proto._y = d3.scale.linear()
        .domain([0,d3.max(this.data, function(d) {
          return d.values;
        })])
        .range([this.height()-this.margin(),this.margin()]);
    this.setup_axes();

    this._svg.selectAll('rect.data')
      .data(this.data)
      .enter()
      .append('rect')
      .attr({
        class: function(d) { return 'data ' + d.key; },
        x: function(d) { return that._x(d.key) - _barwidth/2; },
        y: function(d) { return that._y(d.values); },
        width: _barwidth,
        height: function(d) { return that._y(0) - that._y(d.values); },
        fill: function(d) { return that.colors()(d.key); }
      });

    return this;
  }

  return function chart() {
    var _width = 300, 
        _height = 200,
        _margin = 30,
        _xAxis = null,
        _yAxis = null,
        _colors = d3.scale.category10();

    var o = Object.create({}, {
      _svg: {
        writable: true,
        configurable: true,
        value: null
      }
    });

    o.init = function (sel) {
      this._svg = d3.select(sel)
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

    o.setup_axes = function() {
      _xAxis = d3.svg.axis()
        .scale(this._x)
        .orient('bottom');
      this._svg.append('g')
        .attr({
          class: 'axis x-axis',
          transform: 'translate(0,' + (this.height() - this.margin()) + ')'
        })
        .call(_xAxis);

      _yAxis = d3.svg.axis()
        .scale(this._y)
        .orient('left'); 
      this._svg.append('g')
        .attr({
          class: 'axis y-axis',
          transform: 'translate(' + _margin + ',0)'
        })
        .call(_yAxis);
    }

    o.xAxis = function(value) {
      if (value === undefined) return _xAxis;
      _xAxis = value;
      return this;
    }

    o.xTicks = function(value) {
      if (value === undefined) return _xAxis.ticks();
      if (Array.isArray(value)) {
        /* Specifying tick values. */
        _xAxis.tickValues(value);
      }
      else {
        /* Specifying number of ticks. */
        _xAxis.ticks(value);
      }
      this._svg.select('.x-axis').call(_xAxis);
    }

    o.yAxis = function(value) {
      if (value === undefined) return _yAxis;
      _yAxis = value;
      return this;
    }

    o.plot = function(data) {
      this.data = data;
      if (Array.isArray(data[0].values)) {
        return linegraph.call(this);
      }
      else {
        return bargraph.call(this);
      }
    }

    return o;
  }
})();

var lgraph = chartFactory()
  .width(300)
  .height(400)
  .init('#line')
  .plot(data);

var bgraph = chartFactory()
  .width(350)
  .init('#bar')
  .plot(data_bar);

highlighter('.data',data.map(function(el) { return el.key; }));

