var plot = null;

hljs.initHighlightingOnLoad();

var eplot = (function() {
  "use strict";

  var last_plot = null;

  /*
   * highlighter
   * Small function to enable mouseover effects on 
   * connected charts.
   */
  var highlighter = function(selector,keys) {
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

  /**
   * Linegraph mixin
   * @return {object} the chart object with the linegraph properties and
   *    methods added to the objects' prototype.
   *    TODO: Legend!
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

    // Plot data
    proto.all_paths = this._svg.selectAll('path.data')
      .data(this.data);
    // update selection
    proto.all_paths
      .transition()
      .duration(500)
      .attr({
        d: function(d) { return proto.line(d.values); },
        class: function(d) { return 'data ' + d.key; }
      });
    // enter selection
    proto.all_paths
      .enter()
      .append('path')
      .attr({
        d: function(d) { 
          return proto.line(d.values); 
          },
        class: function(d) { return 'data ' + d.key; },
        stroke: function(d) { return that.colors()(d.key); }
      });
    // exit selection
    proto.all_paths.exit().remove();

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
      if (value === undefined) return _barwidth;
      _barwidth = value;
      return that;
    }

    if (proto._x) {
      proto._x.domain(this.data.map(function(d) { return d.key; }));
    }
    else {
      proto._x = d3.scale.ordinal()
            .domain(this.data.map(function(d) { return d.key; }))
            .rangePoints([this.margin(),this.width()-this.margin()],1.0);
    }

    if (proto._y) {
      proto._y.domain([0,d3.max(this.data, function(d) {
        return d.values;
      })]);
    }
    else {
      proto._y = d3.scale.linear()
          .domain([0,d3.max(this.data, function(d) {
            return d.values;
          })])
          .range([this.height()-this.margin(),this.margin()]);
    }
    this.setup_axes();

    that.colors().domain(this.data.map(function(d) { return d.key; }));

    proto.all_bars = this._svg.selectAll('rect.data')
      .data(this.data);
    // update selection
    proto.all_bars
      .transition()
      .duration(500)
      .attr({
        class: function(d) { return 'data ' + d.key; },
        x: function(d) { return that._x(d.key) - _barwidth/2; },
        y: function(d) { return that._y(d.values); },
        width: _barwidth,
        height: function(d) { return that._y(0) - that._y(d.values); },
        fill: function(d) { return that.colors()(d.key); }
    });
    // enter selection
    proto.all_bars
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
    // exit selection
    proto.all_bars.exit().remove();

    last_plot = this;
    return this;
  }

  /**
   *
   */
  function scatterplot() {
    var proto = Object.getPrototypeOf(this),
        that = this;

   var _radius = 5;
   proto.radius = function(val) {
     if ( val === undefined ) return _radius;
     _radius = val;
     return that;
   }

    
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

    that.setup_axes();

    var color_domain = that.data.map(function(d) { return d.key; });
    this.colors().domain(color_domain.length == 1 ? 
      color_domain[0] : color_domain);

    // Plot data
    this.data.forEach(function(ds) {
      proto.all_circles = that._svg.selectAll('circle.data')
        .data(ds.values);
      // update selection
      proto.all_circles
        .transition()
        .duration(500)
        .attr({
          cx: function(d) { return proto._x(d.x); },
          cy: function(d) { return proto._y(d.y); },
          class: function(d) { return 'data ' + d.key; },
          r: _radius,
          fill: function(d) { return that.colors()(ds.key); }
        });
      // enter selection
      proto.all_circles
        .enter()
        .append('circle')
        .attr({
          cx: function(d) { return proto._x(d.x); },
          cy: function(d) { return proto._y(d.y); },
          class: function(d) { return 'data ' + ds.key; },
          r: _radius,
          fill: function(d) { return that.colors()(ds.key); }
        });
      // exit selection
      proto.all_circles.exit().remove();
    })

    last_plot = this;
    return this;
  } /* scatterplot */

  /**
   * Main chart function.
   */
  function chart() {
    var _width = 300, 
        _height = 200,
        _margin = 30,
        _xAxis = d3.svg.axis().orient('bototm'),
        _yAxis = _yAxis = d3.svg.axis().orient('left'),
        _colors = d3.scale.category10();

    var o = {};

    o.init = function (sel) {
      /* Check if figcaption is available */
      if (d3.select(sel).select('figcaption').empty()) {
        o._svg = d3.select(sel).append('svg');
      }
      else {
        o._svg = d3.select(sel).insert('svg','figcaption');
      }
      o._svg
        .attr({
          width: _width,
          height: _height
        });

      this._svg.append('g')
        .attr({
          class: 'axis x-axis',
          transform: 'translate(0,' + (this.height() - this.margin()) + ')'
        });

      this._svg.append('g')
        .attr({
          class: 'axis y-axis',
          transform: 'translate(' + _margin + ',0)'
        })

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

      _xAxis.scale(this._x);
      this._svg
        .select('.x-axis')
        .call(_xAxis);
      
      _yAxis.scale(this._y);
      this._svg
        .select('.y-axis')
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

    o.plot = function(data,type) {

      plot = this.plot.bind(this);
      if (data === undefined ) {
        data = this.data;
      }
      else {
        this.data = data;
      }


      if (type === 's') {
        /* scatterplot hack for now */
        return scatterplot.call(this);
      }

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

  return {
    chart: chart,
    highlighter: highlighter
  };

})();

d3.selectAll('code')[0]
  .forEach(function(snippet) {
    eval.call(window, snippet.innerText);
  });

eplot.highlighter('.board .data',data.map(function(el) { return el.key; }));

setTimeout(function() {
  sgraph.plot(data01);
  lgraph.plot(data2);
  bgraph.plot(data_bar2);
}, 2000);


