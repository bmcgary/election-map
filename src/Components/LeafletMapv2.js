import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";

import 'leaflet/dist/leaflet.css';
import '../css/leafletmap.css';

var L = window.L;

class LeafletMap extends Component {
    /*
    This will take in a geojson obj/file url to draw districts
    This will take in a data obj to use to color the districts
    */

    constructor(props) {
        super(props);

        this.colorOptions = [
            ['#c51b7d','#de77ae','#f1b6da','#fde0ef','#e6f5d0','#b8e186','#7fbc41','#4d9221'],
            ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#a63603','#7f2704'],
            ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#54278f','#3f007d'],
            ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c','#08306b'],
            ['#f7fcf5','#e5f5e0','#c7e9c0','#a1d99b','#74c476','#41ab5d','#238b45','#006d2c','#00441b'],
            ['#ffffff','#f0f0f0','#d9d9d9','#bdbdbd','#969696','#737373','#525252','#252525','#000000']
        ];
        this.baseScaleSteps = [-100,-82,-75,-50,0,50,75,82,100]//[0,1,2,3,5,10,25,50,75];
        if(this.props.axisValues)
            this.baseScaleSteps = this.props.axisValues;
        this.colorScale = d3.scaleThreshold()
        .domain(this.baseScaleSteps)
        .range(props.colorpallet || this.colorOptions[0]);
        let alteredRange = ["black"].concat(this.colorScale.range());
        alteredRange.push("black");
        this.colorScale.range(alteredRange);
        this.fillOpacity = 1.0;
        this.selectedFeatures = [];

        d3.selection.prototype.moveToFront = function() {  
            return this.each(function(){
              this.parentNode.appendChild(this);
            });
          };
    }

    componentDidMount() {
        this.map = L.map('map', {
            zoomDelta: 0.25
        });

        L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

        this.updateGeoJson();
        this.addLegend(); 
        this.addOpacitySlider();   
        this.updateChoropleth()  ;  
    }

    componentWillUpdate(nextProps) {
        this.baseScaleSteps = [-100,-82,-75,-50,0,50,75,82,100]//[0,1,2,3,5,10,25,50,75];
        if(nextProps.axisValues)
            this.baseScaleSteps = nextProps.axisValues;
        this.colorScale = d3.scaleThreshold()
        .domain(this.baseScaleSteps)
        .range(nextProps.colorpallet || this.colorOptions[0]);
        let alteredRange = ["black"].concat(this.colorScale.range());
        alteredRange.push("black");
        this.colorScale.range(alteredRange)
    }

    componentDidUpdate(prevProps) {
        if(this.props.geojsonData !== prevProps.geojsonData) {
            this.updateGeoJson();
        }
        //if(this.props.choroplethData !== prevProps.choroplethData) {
            this.updateChoropleth();
        //}
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

        const numberOfRects = this.colorScale.range().length - 2;
        this.legendScale = d3.scaleLinear().domain([0,numberOfRects]).range([0,width - 25]);

        d3.select(".legend svg").append("g")
        .classed("axisGroup", true)
        .attr("transform", "translate(12 10)");

        d3.select(".legend svg").append("g")
        .classed("legendRectsGroup", true)
        .attr("transform", "translate(12 5)")
        .selectAll("rect")
        .data(d3.range(numberOfRects))
        .enter().append("rect")
        .attr("id", d => "legend_rect_" + d)
        .classed("legend_rect", true)
        .attr("height", 10)
        .attr("width", (width - 25)/numberOfRects)
        .attr("x", this.legendScale)
        .attr("fill", d => this.colorScale.range()[d + 1])
        .attr("stroke", "black")
        .on("click", d => {
            //when you click on a rect select all features that have that rects color
            this.selectedFeatures.length = 0;

            d3.selectAll(".legend_rect")
                .attr("stroke-width", null);

            if(d === this.selectedRect) { //already selected so deselect everything
                delete this.selectedRect;
            }
            else {
                d3.select("#legend_rect_" + d)
                .attr("stroke-width", 2)
                .moveToFront();
                this.selectedRect = d;
                this.geoJsonLayer
                .eachLayer((layer) => {
                    let uniqueId;
                    let extent = [Number.MAX_VALUE, Number.MIN_VALUE];
                    if(typeof(this.props.union) === "function") {
                        uniqueId = this.props.union(layer.feature.properties);
                    }
                    else {
                        uniqueId = this.props.union;
                    }

                    const featureValue = this.props.choroplethData[uniqueId];
                    let result = 0;
                    if(typeof(featureValue) === "number") {
                        result = featureValue;
                    }
                    else if (typeof(featureValue) === "object") {
                        result = this.props.getResult(featureValue);
                        result = result.amount
                    }
                    if(result < extent[0])
                        extent[0] = result;
                    if (extent[1] < result)
                        extent[1] = result;                

                        //For case when there is only one option to color it will always be 100. But
                        //100 is black, so just go under 100 to get the color
                        //TODO FIX THIS TO WORK OFF DYNAMIC MAX (test any election with only one person and on 'Winner percent')
                    result = result >= 100 ? result - .00001 : result;
                    if(this.colorScale(result) === this.colorScale.range()[d + 1])
                        this.selectedFeatures.push(layer.feature.properties.id);
                    
                });
            }
            this.updateChoropleth();
        })

        this.updateLegend();

    }
    addOpacitySlider() {
        const width = 500;
        const slider = L.control({position:"topright"});
        let backDiv;
        slider.onAdd = function() {
            backDiv = L.DomUtil.create("div", "info slider")
            backDiv.innerHTML += "<input id='opacitySlider' type='range' min='0.5' max='1' step='0.1' defaultValue='1'></input>";
            backDiv.innerHTML += "<div>Opacity Scale</div>"
            return backDiv;
        }

        slider.addTo(this.map);

        const self = this;
        d3.select(".slider")
        .on("mouseover", () => this.map.dragging.disable())
        .on("mouseout", () => this.map.dragging.enable())
        .on("change", () => {
            const v = document.getElementById("opacitySlider").value;
            self.fillOpacity = parseFloat(v);
            self.updateChoropleth();
        }); 
        document.getElementById("opacitySlider").value = "1";    
    }

    updateGeoJson() {
        //Don't want a new layer of geojson features each time the data set changes.
        //Remove the original layer and add a new one
        if(this.geoJsonLayer) {
            this.map.removeLayer(this.geoJsonLayer);
            this.geoJsonLayer = undefined;
        }
        if(this.props.geojsonData !== undefined) {
            let bounds;
            this.geoJsonLayer = L.geoJSON(this.props.geojsonData)
            .eachLayer(layer => {
                layer.on({
                    mouseover: this.mouseHandler.bind(this, layer, this.props.mouseenter),
                    mouseout: this.mouseHandler.bind(this, layer, this.props.mouseenter),
                    click: this.mouseHandler.bind(this, layer, this.featureClickHandler.bind(this))
                });
                if(bounds === undefined) {
                    bounds = L.latLngBounds(layer.getBounds());
                }
                else {
                    bounds.extend(layer.getBounds());
                }
            })            
            .addTo(this.map);

            this.map.fitBounds(bounds);
        }
    }
    updateChoropleth() {
        if(this.props.choroplethData && this.geoJsonLayer) {
            let extent = [Number.MAX_VALUE, Number.MIN_VALUE]
            this.geoJsonLayer
            .eachLayer((layer) => {
                let uniqueId;
                if(typeof(this.props.union) === "function") {
                    uniqueId = this.props.union(layer.feature.properties);
                }
                else {
                    uniqueId = this.props.union;
                }

                const featureValue = this.props.choroplethData[uniqueId];
                let result = 0;
                if(typeof(featureValue) === "number") {
                    result = featureValue;
                }
                else if (typeof(featureValue) === "object") {
                    result = this.props.getResult(featureValue);
                    result = result.amount
                }
                if(result < extent[0])
                    extent[0] = result;
                if (extent[1] < result)
                    extent[1] = result;

                let borderWeight = (this.props.highlightFeatures &&
                    this.props.highlightFeatures.indexOf(uniqueId) > -1) ? 3 : 
                    this.selectedFeatures.indexOf(layer.feature.properties.id) > -1 ? 3 : 1
                

                    //For case when there is only one option to color it will always be 100. But
                    //100 is black, so just go under 100 to get the color
                result = result >= 100 ? result - .00001 : result;
                layer.setStyle({
                    fillColor: result === 0 ? "white" : this.colorScale(result),
                    fillOpacity: this.fillOpacity,
                    weight: borderWeight,
                    color: "black",
                    interactive: true
                })

                if(this.selectedFeatures.indexOf(layer.feature.properties.id) > -1)
                    layer.bringToFront();
                
            });
            this.updateLegend(extent);
        }
    }
    updateLegend(extent) {
        /*let domain = this.colorScale.domain();
        let updateNeeded = false;
        if(extent && extent[0] < domain[0]) {
            domain[0] = extent[0] - 1;
            updateNeeded = true;
        }
        if(extent && domain[domain.length - 1] < extent[extent.length - 1]) {
            domain[domain.length - 1] = extent[extent.length - 1] + 1;
            updateNeeded = true;
        }

        this.colorScale.domain(domain);*/

        let tickValues = [].concat(this.colorScale.range().slice(0,-1).map((color) => {
            return this.colorScale.invertExtent(color)[1];
        }));

        tickValues = this.colorScale.domain();
        this.legendScale.domain([0,tickValues.length-1]);
        const axis = d3.axisBottom(this.legendScale)
            .tickFormat(function(d) {return tickValues[d] && Math.abs(tickValues[d]) + "%"});


        d3.select(".legend svg .axisGroup")
        .call(axis)

        d3.select(".legend svg .domain")
        .remove();
        d3.select(".legend svg .tick line")
        .remove();

        d3.select(".legendRectsGroup")
            .selectAll("rect")
            .attr("fill", d => this.colorScale.range()[d + 1])

        //TODO put in the names of both ends of the legend

        /*if(updateNeeded) {
            this.updateChoropleth();
        }*/
    }

    mouseHandler(layer, callback, e) {
        if(callback)
            callback(e, layer, layer.feature.properties)
    }
    featureClickHandler(e, layer, properties) {
        if(e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
            const arrIndex = this.selectedFeatures.indexOf(properties.id);
            if(arrIndex > -1) { //remove it
                this.selectedFeatures.splice(arrIndex, 1);
                layer.bringToBack();
            }
            else { //add it
                this.selectedFeatures.push(properties.id);
                layer.bringToFront();
            }
        }
        else { //ctrl/meta not pressed. If its selected deselect, or vica versa
            const arrIndex = this.selectedFeatures.indexOf(properties.id);
            this.selectedFeatures.length = 0;
            if(arrIndex == -1) { //add it
                this.selectedFeatures.push(properties.id);
                layer.bringToFront();
            }
        }
        this.updateChoropleth();
    }

    render() {
        return (
            <div id="map"></div>
        );
    }


}


LeafletMap.propTypes = {
    geojsonData: PropTypes.object.isRequired,
    choroplethData: PropTypes.object.isRequired,
    union: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.func
    ]).isRequired,
    colorpallet: PropTypes.arrayOf(PropTypes.string),
    mouseOver: PropTypes.func,
    mouseExit: PropTypes.func,
    axisValues: PropTypes.oneOfType([
        PropTypes.arrayOf(PropTypes.string),
        PropTypes.arrayOf(PropTypes.number),
    ]),
    highlightFeatures: PropTypes.array //elements of this array should be unique ids found in
    //geojsonData and are obtained from the union method. That is, call the union method, get 
    //the uniqueId from geojson, compare it to the elements in highlightFeatures
}

export default LeafletMap;
