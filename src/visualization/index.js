import { rollup, sum } from "d3-array";
import { scaleBand } from "d3-scale";
import { select } from "d3-selection";
import { arc } from "d3-shape";
import moment from "moment";

import { configuration, configurationLayout } from "../configuration.js";
import { degreesToRadians } from "../utilities.js";

/**
 * ActivityClock is a time series visualization.
 * @param {array} data - objects where each represents a path in the hierarchy
 * @param {integerr} hours - number of arcs in clock
 * @param {integer} radius - clock outer radius
 */
class ActivityClock {
    constructor(data, radius=configurationLayout.radius, hours=configurationLayout.hours, label="lgv") {

        // update self
        this.annoation = null;
        this.annotationBackground = null;
        this.annotationHour = null;
        this.annotationHours = null;
        this.arc = null;
        this.artboard = null;
        this.classAnnotation = `${label}-annotation`;
        this.classAnnotationBackground = `${label}-annotation-background`;
        this.classAnnotationHour = `${label}-annotation-hour`;
        this.classAnnotationHourGroup = `${label}-annotation-hour-group`;
        this.classArc = `${label}-arc`;
        this.classArcGroup = `${label}-arc-group`;
        this.classContainer = `${label}-container`;
        this.classLabel = `${label}-label`;
        this.clockHours = hours;
        this.container = null;
        this.dataSource = data;
        this.degreeRotation = 15; // rotate 15 degrees so arcs align to analog clock dial visually
        this.label = null;
        this.name = configuration.name;
        this.ringLabels = ["am", "pm"];
        this.timeOffset = 1;

        // using font size as the base unit of measure make responsiveness easier to manage across devices
        this.artboardUnit = typeof window === "undefined" ? 16 : parseFloat(getComputedStyle(document.body).fontSize);

        // update self
        this.padding = this.artboardUnit * 2;
        this.radius = this.artboardUnit * (parseInt((radius / this.artboardUnit)));

    }

    /**
     * Calculate totals for time units
     * @returns An array of objects where each represents a time unit in entire clock.
     */
    get aggregate() {
        return rollup(this.dataSource ? this.dataSource : [],
            v => sum(v, d => d.value),
            d => moment(d.timestamp).format("a"),
            d => moment(d.timestamp).format("h")
        );
    }

    /**
     * Condition data for visualization requirements.
     * @returns An array of objects where each represents an hour in a 24 hour day.
     */
    get data() {

        // generate rings for ring sets and flatten into 1D array of arc objects
        // generate arcs and map data to each
        return this.ringLabels
            .map((d,i) => this.constructArcs(d))
            .flat();

    }

    get degreeSlice() {
        return 360 / this.clockHours;
    }

    get height() {
        return (this.radius * 2) + this.padding;
    }

    get hourLabels() {
        return [...Array(this.clockHours).keys()].map(i => {

            // generate arc and centroid
            let centroid = arc().centroid(this.constructAngle(i, this.radiusInner, this.radiusOuter, true));

            // generate arc centroid
            return {
                label: i + this.timeOffset,
                x: centroid[0],
                y: centroid[1]
            }

        });
    }

    get radiusInner() {
        return this.radius * 0.5;
    }

    get radiusOuter() {
        return this.radius;
    }

    /**
     * Organize time unit and value in flat key/value map.
     * @returns An object where each key is a time unit scoped to the individual ring/arc combination and corresponding value is the aggregate value for that time unit across the dataset.
     */
    get reference() {

        // establish map
        let obj = {};

        // loop through ring aggregates
        for (const ring of Array.from(this.aggregate)) {

            // loop through arc aggregates
            for (const arc of Array.from(ring[1])) {

                // map to value
                obj[`${ring[0]}-${arc[0]}`] = arc[1];

            }

        };

        return obj;

    }

    get ringWidth() {
        return this.ringScale.bandwidth();
    }

    /**
     * Generate ring scale for concentric circles
     * @returns A d3 band scale function.
     */
    get ringScale() {
         return scaleBand()
            .domain(this.ringLabels)
            .rangeRound([this.radiusInner, this.radiusOuter]);
     }

    get width() {
         return this.radius * 2;
     }

    /**
     * Position and minimally style annotations in SVG dom element.
     */
    configureAnnotations() {
        this.annotation
            .attr("class", this.classAnnotation)
            .attr("x", 0)
            .attr("y", d => d == "am" ? (this.ringScale(d) * -1) + this.artboardUnit : (this.ringScale(d) * -1) - (this.artboardUnit * 3.5))
            .attr("text-anchor", "middle")
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
            .attr("text-anchor", "middle")
            .text(d => d.value);
    }

    /**
     * Method to allow bulk overwrites of arbitrary items.
     */
    configureOverwrites() {
    }

    /**
     * Construct d3 arc.
     * @param {integer} i - angle index in circle which in this case represent an hour in a clock
     * @param {boolean} isAnnotation - TRUE if angles are for clock hour annotations
     * @param {float} radiusInner - angle inner radius value
     * @param {float} radiusOuter - angle outer radius value
     * @returns An object with key/values representing a d3.js arc.
     */
    constructAngle(i, radiusInner, radiusOuter, isAnnotation=false) {
        return {
            startAngle: degreesToRadians((i * this.degreeSlice) + this.degreeRotation),
            endAngle: degreesToRadians((i * this.degreeSlice) + this.degreeSlice + this.degreeRotation),
            innerRadius: isAnnotation ? (this.radius - this.ringWidth) : radiusInner,
            outerRadius: isAnnotation ? (this.radius - this.ringWidth) : radiusOuter
        };
    }

    /**
     * Construct arc values for layout.
     * @param {string} arcKey - label for arc
     * @param {string} ringKey - label for ring
     * @returns An array of objects where each represents a time unit.
     */
    constructArcs(ringKey) {

        let ringIndex = this.ringLabels.indexOf(ringKey);

        // generate svg paths for arcs divided into even slices
        return [...Array(this.clockHours).keys()].map(i => {

            // determine upper bounds of arc radius
            let outerRadius = this.ringScale(ringKey);

            // declare arc properties
            // inner radius seems backward + vs. - bc of svg artboard direction
            let a = this.constructAngle(i, outerRadius + this.ringWidth, outerRadius);

            // pull data from source data
            let value = this.reference[`${ringKey}-${i}`];

            // generate arc path/centroid
            return {
                centroid: arc().centroid(a),
                id: i,
                label: `${ringKey}-${i}`,
                path: arc()(a),
                value: value ? value : 0
            }

        });

    }

    /**
     * Generate hour text annotation in SVG element.
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

        // condition data
        // which will generate clock structure
        // pull actual data from provided source
        // bind to time arc in the clock
        this.dataFormatted = this.data;

        // generate svg artboard
        this.artboard = this.generateArtboard(this.container);
        this.configureArtboard();
this.artboard.append("rect").attr("x", 0).attr("y", 0).attr("width", this.width).attr("height", this.height).attr("fill", "lightgrey")
        // wrap for content to ensure nodes render within artboard
        this.content = this.generateContainer(this.artboard);
        this.configureContainer();

        // generate arcs in concentric rings
        this.arc = this.generateArcs(this.content);
        this.configureArcs();
        this.configureArcsEvents();

        // am/pm
        this.annotation = this.generateAnnotations(this.content);
        this.configureAnnotations();

        // hours
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

        // allow overwrites to facilitate outside of complete method overwriting
        this.configureOverwrites();

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
        // which will generate clock structure
        // pull actual data from provided source
        // bind to time arc in the clock
        this.dataFormatted = this.data;

        // generate visualization
        this.generateVisualization(styles);

    }

}

export { ActivityClock };
export default ActivityClock;
