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
        this.annotationBackground = null;
        this.annotationHour = null;
        this.annotationHours = null;
        this.arc = null;
        this.artboard = null;
        this.classAnnotation = "lgv-annotation";
        this.classAnnotationBackground = "lgv-annotation-background";
        this.classAnnotationHour = "lgv-annotation-hour";
        this.classAnnotationHourGroup = "lgv-annotation-hour-group";
        this.classArc = "lgv-arc";
        this.classArcGroup = "lgv-arg-group";
        this.classContainer = "lgv-container";
        this.classLabel = "lgv-label";
        this.container = null;
        this.dataSource = data;
        this.degreeSlice = 360 / 12;
        this.degreeRotation = 15; // rotate 15 degrees so arcs align to analog clock dial visually
        this.label = null;
        this.name = configuration.name;
        this.radiusInner = null;
        this.radiusOuter = null;
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
        this.hourLabels = [...Array(12).keys()].map(i => {

            // generate arc and centroid
            let centroid = arc().centroid(this.constructAngle(i, true));

            // generate arc centroid
            return {
                label: i + 1,
                x: centroid[0],
                y: centroid[1]
            }

        });

        // condition data
        // which will generate clock structure
        // pull actual data from provided source
        // bind to time arc in the clock
        this.dataFormatted = this.data;

    }

    /**
     * Condition data for visualization requirements.
     * @returns An array of objects where each represents an hour in a 24 hour day.
     */
    get data() {

        // calculate totals for all hours in source
        let aggregateHours = rollup(this.dataSource ? this.dataSource : [],
            v => sum(v, d => d.value),
            d => moment(d.timestamp).format("H")
        );

        // organize as simple key/value object
        // hour: value
        this.dataReference = {};
        for (const hour of Array.from(aggregateHours)) { this.dataReference[hour[0]] = hour[1]; }

        // generate rings for AM/PM sets and flatten into 1D array of arc objects
        return this.ringLabels.map((d, i) => {

            // set radius
            this.radiusOuter = i == 0 ? this.radius : this.radius - (this.ringWidth * i);
            this.radiusInner = this.radiusOuter - this.ringWidth;

            // generate arcs and map data to each
            return this.constructArcs(d);

        }).flat();

    }

    /**
     * Position and minimally style annotations in SVG dom element.
     */
    configureAnnotations() {
        this.annotation
            .attr("class", this.classAnnotation)
            .attr("x", this.width / 2)
            .attr("y", d => d == "am" ? (this.ringWidth * 2) + (this.artboardUnit * 4) : (this.artboardUnit + 5))
            .text(d => d);
    }

    /**
     * Position and minimally style clock hour annotations background in SVG dom element.
     */
    configureAnnotationsBackground() {
        this.annotationBackground
            .attr("class", this.classAnnotationBackground)
            .attr("r", this.artboardUnit * 2)
            .attr("cx", 0)
            .attr("cy", 0);
    }

    /**
     * Position and minimally style clock hour annotation groups in SVG dom element.
     */
    configureAnnotationsHours() {
        this.annotationHours
            .attr("class", this.classAnnotationHourGroup)
            .attr("transform", d => `translate(${d.x}, ${d.y})`);
    }

    /**
     * Position and minimally style clock hour annotations in SVG dom element.
     */
    configureAnnotationsHoursText() {
        this.annotationHour
            .attr("class", this.classAnnotationHour)
            .attr("text-anchor", "middle")
            .attr("dy", this.artboardUnit * 0.35)
            .text(d => d.label);
    }

    /**
     * Position and minimally style arcs in SVG dom element.
     */
    configureArcs() {
        this.arc
            .attr("class", this.classArcGroup)
            .selectAll(`.${this.classArc}`)
            .data(d => [d])
            .join(
                enter => enter.append("path"),
                update => update,
                exit => exit.remove()
            )
            .attr("class", this.classArc)
            .attr("data-arc-value", d => d.value)
            .attr("d", d => d.path);
    }

    /**
     * Configure events on arcs in SVG dom element.
     */
    configureArcsEvents() {
        this.arc
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
                select(e.target).attr("class", `${this.classArc} active`);

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
                select(e.target).attr("class", this.classArc);

                // send event to parent
                this.artboard.dispatch("arcmouseout", {
                    bubbles: true
                });

            });
    }

    /**
     * Position and minimally style SVG dom element.
     */
    configureArtboard() {
        this.artboard
            .attr("class", this.name)
            .attr("viewBox", d => `0 0 ${d.width} ${d.height}`);
    }

    /**
     * Position and minimally style containing group in SVG dom element.
     */
    configureContainer() {
        this.content
            .attr("class", this.classContainer)
            .attr("transform", `translate(${this.width /2},${(this.height / 2) + (this.padding / 2)})`);
    }

    /**
     * Position and minimally style labels in SVG dom element.
     */
    configureLabels() {
        this.label
            .attr("class", this.classLabel)
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
        return {
            startAngle: degreesToRadians((i * this.degreeSlice) + this.degreeRotation),
            endAngle: degreesToRadians((i * this.degreeSlice) + this.degreeSlice + this.degreeRotation),
            innerRadius: isAnnotation ? (this.radius - this.ringWidth) : this.radiusInner,
            outerRadius: isAnnotation ? (this.radius - this.ringWidth) : this.radiusOuter
        };
    }

    /**
     * Construct arc values for layout.
     * @param {string} label - label for ring
     * @returns An array of objects where each represents an hour in the 12-hour set.
     */
    constructArcs(label) {

        // determine am or pm ring
        let isAM = label == "am";

        // generate svg paths for arcs divided into 12 even slices
        return [...Array(12).keys()].map(i => {

            // declare arc properties
            let a = this.constructAngle(i);

            // pull data from source data
            let value = this.dataReference[isAM ? i + 1 : i + 13];

            // generate arc path/centroid
            return {
                centroid: arc().centroid(a),
                id: i,
                label: `${i + 1} ${label}`,
                path: arc()(a),
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
            .selectAll(`.${this.classAnnotation}`)
            .data(this.ringLabels)
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate clock hour text annotation group in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotationsHours(domNode) {
        return domNode
            .selectAll(`.${this.classAnnotationHourGroup}`)
            .data(this.hourLabels)
            .join(
                enter => enter.append("g"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate clock hour text annotation background shapes in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotationsBackground(domNode) {
        return domNode
            .selectAll(`.${this.classAnnotationBackground}`)
            .data(d => [d])
            .join(
                enter => enter.append("circle"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate clock hour text annotation text in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateAnnotationsHoursText(domNode) {
        return domNode
            .selectAll(`.${this.classAnnotationHour}`)
            .data(d => [d])
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate concentric rings of arc shapes in SVG element.
     * @param {node} domNode - d3.js SVG selection
     * @returns A d3.js selection.
     */
    generateArcs(domNode) {
        return domNode
            .selectAll(`.${this.classArcGroup}`)
            .data(this.dataFormatted ? this.dataFormatted : [])
            .join(
                enter => enter.append("g"),
                update => update,
                exit => exit.remove()
            );
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
            );
    }

    /**
     * Generate SVG group to hold content that can not be trimmed by artboard.
     * @param {selection} domNode - d3 selection
     * @returns A d3.js selection.
     */
    generateContainer(domNode) {
        return domNode
            .selectAll(this.classContainer)
            .data(d => [d])
            .join(
                enter => enter.append("g"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate labels in SVG element.
     * @param {node} domNode - d3.js SVG selection
     */
    generateLabels(domNode) {
        return domNode
            .selectAll(`.${this.classLabel}`)
            .data(d => [d])
            .join(
                enter => enter.append("text"),
                update => update,
                exit => exit.remove()
            );
    }

    /**
     * Generate visualization.
     * @param {styles} object - key/value pairs where each key is a CSS property and corresponding value is its value
     */
    generateVisualization(styles) {

        // generate svg artboard
        this.artboard = this.generateArtboard(this.container);
        this.configureArtboard();

        // wrap for content to ensure nodes render within artboard
        this.content = this.generateContainer(this.artboard);
        this.configureContainer();

        // generate arcs in concentric rings
        this.arc = this.generateArcs(this.content);
        this.configureArcs();
        this.configureArcsEvents();

        // am/pm
        this.annotation = this.generateAnnotations(this.artboard);
        this.configureAnnotations();

        // 12 hours
        this.annotationHours = this.generateAnnotationsHours(this.content);
        this.configureAnnotationsHours();
        // background
        this.annotationBackground = this.generateAnnotationsBackground(this.annotationHours);
        this.configureAnnotationsBackground();
        // text
        this.annotationHour = this.generateAnnotationsHoursText(this.annotationHours);
        this.configureAnnotationsHoursText();

        // generate labels
        this.label = this.generateLabels(this.arc);
        this.configureLabels();

        // style arcs from provided
        this.styleArcs(styles);

    }

    /**
     * Render visualization.
     * @param {node} domNode - HTML node
     * @param {styles} object - key/value pairs where each key is a CSS property and corresponding value is its value
     */
    render(domNode, styles) {

        // update self
        this.container = select(domNode);

        // generate visualization
        this.generateVisualization(styles);

    }

    /**
     * Style arcs in SVG dom element.
     */
    styleArcs(styles = null) {

        // check if provided
        if (styles) {

            // add each declared style
            for (const key in styles) {
                this.arc
                    .selectAll(`.${this.classArc}`)
                    .attr(key, styles[key]);
            }

        }

    }

    /**
     * Update visualization.
     * @param {object} data - key/values where each key is a series label and corresponding value is an array of values
     * @param {styles} object - key/value pairs where each key is a CSS property and corresponding value is its value
     */
    update(data, styles) {

        // update self
        this.dataSource = data;

        // condition data
        this.dataFormatted = this.data;

        // generate visualization
        this.generateVisualization(styles);

    }

}

export { ActivityClock };
export default ActivityClock;
