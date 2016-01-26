"use strict";

/*
 * Just a collection of test data sets
 */

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

var data_bar2 = data2.map(function(el) {
  return {
    key: el.key,
    values: d3.sum(el.values, function(d) { return d.y; })
  };
});

var datas = [{
  key: 'a',
  values: [
    { x: 0, y: 10 },
    { x: 1, y: 16 },
    { x: 2, y: 10 },
    { x: 3, y: 12 },
    { x: 4, y: 7 },
    { x: 0, y: 12 },
    { x: 1, y: 11 },
    { x: 2, y: 7 },
    { x: 3, y: 19 },
    { x: 4, y: 12 },
    { x: 0, y: 12 },
    { x: 1, y: 6 },
    { x: 2, y: 20 },
    { x: 3, y: 15 },
    { x: 4, y: 23 },
  ]
}];
