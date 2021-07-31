import { rollup, sum } from "d3-array";
import { select } from "d3-selection";
import { arc } from "d3-shape";
import moment from "moment";

import { configuration, configurationLayout } from "../configuration.js";
import { degreesToRadians } from "../utilities.js";

/**
 * ActivityClock is a time series visualization.
 * @param {array} data - objects where each represents a path in the hierarchy
 * @param {integer} radius - clock outer radius
 */
class ActivityClock {
    constructor(data, radius=configurationLayout.radius) {

        // update self
        this.annoation = null;
        this.arc = null;
        this.dataSource = data;
        this.label = null;
        this.ringLabels = ["am", "pm"];

        // using font size as the base unit of measure make responsiveness easier to manage across devices
        this.artboardUnit = typeof window === "undefined" ? 16 : parseFloat(getComputedStyle(document.body).fontSize);

        // determine how many units exist inside requested dimension
        let numberOfUnits = parseInt((radius / this.artboardUnit));

        // update self
        this.padding = this.artboardUnit * 2;
        this.radius = this.artboardUnit * numberOfUnits;
        this.ringWidth = (this.radius - (this.radius * 0.55)) / this.ringLabels.length;
        this.height = (this.radius * 2) + this.padding;
        this.width = this.radius * 2;

        // calculate totals for all hours in source
        let aggregateHours = rollup(data ? data : [],
            v => sum(v, d => d.value),
            d => moment(d.timestamp).format("HH")
        );

        // organize as simple key/value object
        this.dataReference = {};

        // loop through hours
        for (const hour of Array.from(aggregateHours)) { this.dataReference[hour[0]] = hour[1]; }

        // condition data
        // which will generate clock structure
        // pull actual data from provided source
        // bind to time arc in the clock
        this.dataFormatted = this.data;

    }

    /**
     * Condition data for visualization requirements.
     * @returns An array of objects where each represents a ring label which should correspond to 12 hour clock hour sets.
     */
    get data() {

        // generate rings
        let rings = this.ringLabels.map((d, i) => {

            // set radius
            let outerRadius = i == 0 ? this.radius : this.radius - (this.ringWidth * i);
            let innerRadius = outerRadius - this.ringWidth;

            // generate arcs and map data to each
            return this.constructArcs(innerRadius, outerRadius, d);

        });

        return rings.flat();

    }

    /**
     * Position and minimally style annotations in SVG dom element.
     */
    configureAnnotations() {
        this.annotation
            .attr("class", "lgv-annotation")
            .attr("x", d => this.width / 2)
            .attr("y", d => d == "am" ? (this.ringWidth * 2) + (this.artboardUnit * 3.5) : this.artboardUnit)
            .text(d => d);
    }

    /**
     * Position and minimally style arcs in SVG dom element.
     */
    configureArcs() {
        this.arc
            .attr("class", "lgv-arc")
            .attr("d", d => d.path);
    }

    /**
     * Position and minimally style labels in SVG dom element.
     */
    configureLabels() {
        this.label
            .attr("class", "lgv-label")
            .attr("x", d => d.centroid[0])
            .attr("y", d => d.centroid[1])
            .text(d => d.value);
    }

    /**
     * Construct arc values for layout.
     * @param {float} innerRadius - radius of inner circle of ring
     * @param {string} label - label for ring
     * @param {float} outerRadius - radius of outer circle of ring
     * @returns An array of objects where each represents an hour in the 12-hour set.
     */
    constructArcs(innerRadius, outerRadius, label) {

        let arcGenerator = arc();

        // divide into 12 even arcs
        let hours = [...Array(12).keys()];

        // determine am or pm ring
        let isAM = label == "am";

        // generate svg paths for arcs
        return hours.map(i => {

            // evenly distribute
            let degreeSlice = 360 / hours.length;

            // rotate 15 degrees so arcs align to analog clock dial visually
            let degreeRotation = 15;

            // declare properties
            let a = {
                startAngle: degreesToRadians((i * degreeSlice) + degreeRotation),
                endAngle: degreesToRadians((i * degreeSlice) + degreeSlice + degreeRotation),
                innerRadius: innerRadius,
                outerRadius: outerRadius
            };

            // pull data from source data
            let value = this.dataReference[isAM ? i + 1 : i + 13];

            // generate arc path
            // generate arc centroid
            return {
                centroid: arcGenerator.centroid(a),
                path: arcGenerator(a),
                value: value ? value : 0
            }

        });

    }

    /**
     * Generate SVG artboard in the HTML DOM.
     * @param {node} domNode - HTML node
     * @returns A d3.js selection.
     */
    generateArtboard(domNode) {
        return select(domNode)
            .append("svg")
            .attr("viewBox", `0 0 ${this.width} ${this.height}`)
            .attr("class", configuration.name);
    }

    /**
     * Generate labels in SVG element.
     * @param {node} artboard - d3.js SVG selection
     */
    generateLabels(artboard) {
        return artboard
            .selectAll(".lgv-label")
            .data(this.dataFormatted ? this.dataFormatted : [])
            .enter()
            .append("text");
    }

    /**
     * Generate 12-hour text annotation in SVG element.
     * @param {node} artboard - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotations(artboard) {
        return artboard
            .selectAll(".lgv-annotation")
            .data(this.ringLabels)
            .enter()
            .append("text");
    }

    /**
     * Generate concentric rings of arc shapes in SVG element.
     * @param {node} artboard - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateArcs(artboard) {
        return artboard
            .selectAll(".lgv-arc")
            .data(this.dataFormatted ? this.dataFormatted : [])
            .enter()
            .append("path");
    }

    /**
     * Render visualization.
     * @param {node} domNode - HTML node
     */
    render(domNode) {

        // generate svg artboard
        let artboard = this.generateArtboard(domNode);

        // add inner wrap for rings
        let g = artboard.append("g")
            .attr("transform", `translate(${this.width /2},${(this.height / 2) + (this.padding / 2)})`);

        // generate arcs in concentric rings
        this.arc = this.generateArcs(g);

        // position/style arcs
        this.configureArcs();

        // generate text label
        this.label = this.generateLabels(g);

        // position/style labels
        this.configureLabels();

        // generate 12-hour set annotations
        this.annotation = this.generateAnnotations(artboard);

        // position/style annotations
        this.configureAnnotations();

    }

};

export { ActivityClock };
export default ActivityClock;
