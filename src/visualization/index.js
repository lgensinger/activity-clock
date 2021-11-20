import { rollup, sum } from "d3-array";
import { select } from "d3-selection";
import { arc } from "d3-shape";
import moment from "moment";

import { configurationLayout } from "../configuration.js";
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
        this.annotationHours = null;
        this.arc = null;
        this.artboard = null;
        this.container = null;
        this.dataSource = data;
        this.degreeSlice = 360 / 12;
        // rotate 15 degrees so arcs align to analog clock dial visually
        this.degreeRotation = 15;
        this.innerRadius = null
        this.label = null;
        this.outerRadius = null;
        this.ringLabels = ["pm", "am"];

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
            d => moment(d.timestamp).format("H")
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

        // generate hour annotation angles
        this.hourLabels = [...Array(12).keys()].map(i => {

            // declare properties
            let a = this.constructAngle(i, true);

            // get centroid
            let centroid = arc().centroid(a);

            // generate arc centroid
            return {
                label: i + 1,
                x: centroid[0],
                y: centroid[1]
            }

        });

    }

    /**
     * Condition data for visualization requirements.
     * @returns An array of objects where each represents a ring label which should correspond to 12 hour clock hour sets.
     */
    get data() {

        // generate rings
        let rings = this.ringLabels.map((d, i) => {

            // set radius
            this.outerRadius = i == 0 ? this.radius : this.radius - (this.ringWidth * i);
            this.innerRadius = this.outerRadius - this.ringWidth;

            // generate arcs and map data to each
            return this.constructArcs(d);

        });

        return rings.flat();

    }

    /**
     * Position and minimally style annotations in SVG dom element.
     */
    configureAnnotations() {
        this.annotation
            .attr("x", this.width / 2)
            .attr("y", d => d == "am" ? (this.ringWidth * 2) + (this.artboardUnit * 4) : (this.artboardUnit + 5))
            .text(d => d);
    }

    /**
     * Position and minimally style clock hour annotations in SVG dom element.
     */
    configureAnnotationsHours() {
        this.annotationHours
            .attr("x", d => d.x)
            .attr("y", d => d.y + (this.artboardUnit * 0.6))
            .text(d => d.label);
    }

    /**
     * Position and minimally style arcs in SVG dom element.
     */
    configureArcs() {
        this.arc
            .attr("data-arc-value", d => d.value)
            .attr("d", d => d.path)
            .on("click", (e,d) => {

                // send event to parent
                this.artboard.dispatch("arcclick", {
                    bubbles: true,
                    detail: {
                        id: d.id,
                        label: d.label,
                        value: d.value,
                        xy: [e.clientX + (this.artboardUnit / 2), e.clientY + (this.artboardUnit / 2)]
                    }
                });

            })
            .on("mouseover", (e,d) => {

                // update class
                select(e.target).attr("class", "lgv-arc active");

                // send event to parent
                this.artboard.dispatch("arcmouseover", {
                    bubbles: true,
                    detail: {
                        id: d.id,
                        label: d.label,
                        value: d.value,
                        xy: [e.clientX + (this.artboardUnit / 2), e.clientY + (this.artboardUnit / 2)]
                    }
                });

            })
            .on("mouseout", e => {

                // update class
                select(e.target).attr("class", "lgv-arc");

                // send event to parent
                this.artboard.dispatch("arcmouseout", {
                    bubbles: true
                });

            });
    }

    /**
     * Position and minimally style labels in SVG dom element.
     */
    configureLabels() {
        this.label
            .attr("data-arc-value", d => d.value)
            .attr("x", d => d.centroid[0])
            .attr("y", d => d.centroid[1])
            .attr("dy", "0.35em")
            .text(d => d.value);
    }

    /**
     * Construct d3 arc.
     * @param {integer} i - angle index in circle which in this case represent an hour in a clock
     * @param {boolean} isAnnotation - TRUE if angles are for clock hour annotations
     * @returns An object with key/values representing a d3.js arc.
     */
    constructAngle(i, isAnnotation=false) {

        let outerRadius = isAnnotation ? (this.radius - this.ringWidth) : this.outerRadius;
        let innerRadius = isAnnotation ? (this.radius - this.ringWidth) : this.innerRadius;

        return {
            startAngle: degreesToRadians((i * this.degreeSlice) + this.degreeRotation),
            endAngle: degreesToRadians((i * this.degreeSlice) + this.degreeSlice + this.degreeRotation),
            innerRadius: innerRadius,
            outerRadius: outerRadius
        };

    }

    /**
     * Construct arc values for layout.
     * @param {string} label - label for ring
     * @returns An array of objects where each represents an hour in the 12-hour set.
     */
    constructArcs(label) {

        let arcGenerator = arc();

        // divide into 12 even arcs
        let hours = [...Array(12).keys()];

        // determine am or pm ring
        let isAM = label == "am";

        // generate svg paths for arcs
        return hours.map(i => {

            // declare properties
            let a = this.constructAngle(i);

            // pull data from source data
            let value = this.dataReference[isAM ? i + 1 : i + 13];

            // generate arc path
            // generate arc centroid
            return {
                centroid: arcGenerator.centroid(a),
                id: i,
                label: `${i + 1} ${label}`,
                path: arcGenerator(a),
                value: value ? value : 0
            }

        });

    }

    /**
     * Generate 12-hour text annotation in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotations(domNode) {
        return domNode
            .selectAll(".lgv-annotation")
            .data(this.ringLabels)
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", "lgv-annotation");
    }

    /**
     * Generate clock hour text annotation in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotationsHours(domNode) {
        return domNode
            .selectAll(".lgv-annotation-hour")
            .data(this.hourLabels)
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", "lgv-annotation-hour");
    }

    /**
     * Generate concentric rings of arc shapes in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateArcs(domNode) {
        return domNode
            .selectAll(".lgv-arc")
            .data(this.dataFormatted ? this.dataFormatted : [])
            .join(
                enter => enter.append("path"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", "lgv-arc");
    }

    /**
     * Generate SVG artboard in the HTML DOM.
     * @param {selection} domNode - d3 selection
     * @returns A d3.js selection.
     */
    generateArtboard(domNode) {
        return domNode
            .selectAll("svg")
            .data([{height: this.height, width: this.width}])
            .join(
                enter => enter.append("svg"),
                update => update,
                exit => exit.remove()
            )
            .attr("viewBox", d => `0 0 ${d.width} ${d.height}`)
            .attr("class", this.name);
    }

    /**
     * Generate SVG group to hold content that can not be trimmed by artboard.
     * @param {selection} domNode - d3 selection
     * @returns A d3.js selection.
     */
    generateContainer(domNode) {
        return domNode
            .selectAll(".lgv-container")
            .data(d => [d])
            .join(
                enter => enter.append("g"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", "lgv-container")
            .attr("transform", `translate(${this.width /2},${(this.height / 2) + (this.padding / 2)})`);
    }

    /**
     * Generate labels in SVG element.
     * @param {node} domNode - d3.js SVG selection
     */
    generateLabels(domNode) {
        return domNode
            .selectAll(".lgv-label")
            .data(this.dataFormatted ? this.dataFormatted : [])
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", "lgv-label");
    }

    /**
     * Generate visualization.
     */
    generateVisualization() {

        // generate svg artboard
        this.artboard = this.generateArtboard(this.container);
        this.artboard.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("fill", "lightgrey");

        // wrap for content to ensure nodes render within artboard
        this.content = this.generateContainer(this.artboard);

        // generate arcs in concentric rings
        this.arc = this.generateArcs(this.content);

        // position/style arcs
        this.configureArcs();

        // generate 12-hour set annotations
        this.annotation = this.generateAnnotations(this.artboard);
        //this.annotationHours = this.generateAnnotationsHours(this.content);

        // position/style annotations
        this.configureAnnotations();
        //this.configureAnnotationsHours();

        // generate labels
        this.label = this.generateLabels(this.content);

        // position/style labels
        this.configureLabels();

    }

    /**
     * Render visualization.
     * @param {node} domNode - HTML node
     */
    render(domNode) {

        // update self
        this.container = select(domNode);

        // generate visualization
        this.generateVisualization();

    }

    /**
     * Update visualization.
     * @param {object} data - key/values where each key is a series label and corresponding value is an array of values
     * @param {integer} height - height of artboard
     * @param {integer} width - width of artboard
     */
    update(data, width, height) {

        // update self
        this.dataSource = data;
        this.height = height;
        this.width = width;

        // generate visualization
        this.generateVisualization();

    }

}

export { ActivityClock };
export default ActivityClock;
