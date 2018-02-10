import React, { Component } from 'react';
import * as d3 from "d3";

import 'leaflet/dist/leaflet.css';
import '../css/leafletmap.css';

var L = window.L;

class LeafletMap extends Component {
    /*
    This will take in a geojson obj/file url to draw districts
    This will take in a data obj to use to color the districts
    */

    constructor() {
        super();

        this.colorOptions = [
            ['#c51b7d','#de77ae','#f1b6da','#fde0ef','#e6f5d0','#b8e186','#7fbc41','#4d9221'],
            ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#a63603','#7f2704'],
            ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d'],
            ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'],
            ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b'],
            ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']
        ];
        this.baseScaleSteps = [,-30,-20,-10,0,10,20,30]//[0,1,2,3,5,10,25,50,75];
        this.colorScale = d3.scaleThreshold()
        .domain(this.baseScaleSteps)
        .range(this.colorOptions[0]);
    }

    componentDidMount() {
        this.map = L.map('map').setView([46.273533, -119.188948], 9);

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.addLegend();        

       // this.electionUpdated();
    }

    componentDidUpdate(newProps) {
        this.electionUpdated();
    }

    addLegend() {
        const width = 500;
        const legend = L.control({position:"topright"});
        legend.onAdd = function() {
            const div = L.DomUtil.create("div", "info legend")
            div.innerHTML += "<svg width='" + width + "' height='" + 30 + "'></svg>";
            return div;
        }

        legend.addTo(this.map);

        const numberOfRects = this.colorScale.range().length;
        this.legendScale = d3.scaleLinear().domain([0,numberOfRects]).range([0,width - 25]);

        d3.select(".legend svg").append("g")
        .classed("axisGroup", true)
        .attr("transform", "translate(5 5)");

        d3.select(".legend svg").append("g")
        .classed("legendRectsGroup", true)
        .attr("transform", "translate(5 0)")
        .selectAll("rect")
        .data(d3.range(numberOfRects))
        .enter().append("rect")
        .attr("height", 10)
        .attr("width", (width - 25)/numberOfRects)
        .attr("x", this.legendScale)
        .attr("fill", d => this.colorScale.range()[d])
        .attr("stroke", "black");
    }

    electionUpdated(name) {
        this.updateGeoJson();
        this.updateChoropleth();
        this.updateLegend();
    }

    updateGeoJson() {
        //Don't want a new layer of geojson features each time the data set changes.
        //Remove the original layer and add a new one
        if(this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
            this.geoJsonLayer = undefined;
        }
        if(this.props.geojsonData !== undefined)
            this.geoJsonLayer = L.geoJSON(this.props.geojsonData).addTo(this.map);
    }
    updateChoropleth() {
        this.geoJsonLayer && this.geoJsonLayer
            .eachLayer((layer) => {
                const thisPrecinctData = this.props.precintData["\"" + layer.feature.properties.id + "\""];
                let endResult = 0;
                if(thisPrecinctData) {
                    const max = Object.values(thisPrecinctData).reduce((a,b) => a + parseInt(b.replace("\"","")), 0);
                    const results = Object.values(thisPrecinctData).map(d => parseFloat(d.replace("\"", "")) / max)
                    if(results.length > 1)
                        endResult = (results[1] - results[0]) * 100;
                    else
                        endResult = results[0];

                }

                layer.setStyle({
                    fillColor: this.colorScale(endResult),
                    fillOpacity: 1.0,
                    weight: 1,
                    color: "black",
                    interactive: true
                })
                .on({
                    mouseover: this.props.mouseenter,
                    mouseout: this.props.mouseexit
                })
            });
    }
    updateLegend() {

        const tickValues = [].concat(this.colorScale.range().map((color) => {
            return this.colorScale.invertExtent(color)[1];
        }));

        this.legendScale.domain([0,tickValues.length]);
        const axis = d3.axisBottom(this.legendScale)
            .tickFormat(function(d) {return tickValues[d] && Math.abs(tickValues[d])});


        d3.select(".legend svg .axisGroup")
        .call(axis)

        d3.select(".legend svg .domain")
        .remove();
        d3.select(".legend svg .tick line")
        .remove();
    }

    render() {
        return (
            <div id="map"></div>
        );
    }


}

export default LeafletMap;
