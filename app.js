"use strict";

var data0 = [10,30,20,40];
var data01 = [15,25,9,43,44];

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

var data2 = d3.nest()
  .key(function(el) {return el.lab;})
  .entries([
    {x: 1, y: 15, lab: 'e' },
    {x: 2, y: 23, lab: 'e' },
    {x: 3, y: 5, lab: 'e' },
    {x: 4, y: 1, lab: 'e' },
    {x: 5, y: 10, lab: 'e' },
    {x: 1, y: 12, lab: 'f' },
    {x: 2, y: 13, lab: 'f' },
    {x: 3, y: 17, lab: 'f' },
    {x: 4, y: 17, lab: 'f' },
    {x: 1, y: 13, lab: 'g' },
    {x: 2, y: 12, lab: 'g' },
    {x: 3, y: 19, lab: 'g' },
    {x: 4, y: 21, lab: 'g' }
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

    /*
     * get_lim function
     * @returns {number} the limit as specified by the lim_fcn
     */
    var get_lim = function(data,lim_fcn,acc_fcn) {
      return lim_fcn(data.map(function(ds) { return ds.values; }),
        function(d1) { return lim_fcn(d1, function(d2) {
          return acc_fcn(d2); }) });
    };

    var x_min = get_lim(this.data, d3.min, function(d) { return d.x; });
    var x_max = get_lim(this.data, d3.max, function(d) { return d.x; });

    if (proto._x) {
      proto._x.domain([x_min,x_max]);
    }
    else {
      proto._x = d3.scale.linear()
        .domain([x_min,x_max])
        .range([this.margin(),this.width()-this.margin()])
    }

    var y_min = get_lim(this.data, d3.min, function(d) { return d.y; });
    var y_max = get_lim(this.data, d3.max, function(d) { return d.y; });

    if (proto._y) {
      proto._y.domain([y_min,y_max]);
    }
    else {
      proto._y = d3.scale.linear()
          .domain([y_min,y_max])
          .range([this.height()-this.margin(),this.margin()]);
    }

    this.setup_axes();

    proto.line = d3.svg.line()
      .x(function(el) { return that._x(el.x); })
      .y(function(el) { return that._y(el.y); });
    this.colors().domain(this.data.map(function(el) { return el.key; }));

    proto.all_paths = this._svg.selectAll('path.data')
      .data(this.data)
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

  /**
   * Main chart function.
   */
  return function chart() {
    var _width = 300, 
        _height = 200,
        _margin = 30,
        _xAxis = null,
        _yAxis = null,
        _colors = d3.scale.category10();

    var o = {};

    o.init = function (sel) {
      o._svg = d3.select(sel)
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
    };

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
      return this;
    };

    o.yAxis = function(value) {
      if (value === undefined) return _yAxis;
      _yAxis = value;
      return this;
    }

    o.yTicks = function(value) {
      if (value === undefined) return _yAxis.ticks();
      if (Array.isArray(value)) {
        _yAxis.tickValues(value);
      }
      else {
        _yAxis.ticks(value);
      }
      this._svg.select('.y-axis').call(_yAxis);
      return this;
    };

    o.plot = function(data) {
      this.data = data;
      if (data[0].key) { // nested structure
        if (Array.isArray(data[0].values)) {
          return linegraph.call(this);
        }
        else {
          return bargraph.call(this);
        }
      }
      else { // flat structure
        if (data[0].x) {
        }
        else { // no accessor function
          var values = data.map(function(d,i) {
            return {x:i, y:d} 
          });
          this.data = [{
            'key': 'dummy',
            'values': values
          }];
          return linegraph.call(this);
        }
      }
    }
    return Object.create(o);
  }
})();

var sgraph = chartFactory()
  .init('#basic')
  .plot(data0);

setTimeout(function() {
  sgraph.plot(data01);
}, 1000);

var lgraph = chartFactory()
  .width(300)
  .height(400)
  .init('#line')
  .plot(data)
  .xTicks(4);

var bgraph = chartFactory()
  .width(350)
  .init('#bar')
  .plot(data_bar)
  .yTicks(5);

highlighter('.board .data',data.map(function(el) { return el.key; }));


