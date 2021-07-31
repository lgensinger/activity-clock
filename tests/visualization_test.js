import test from "ava";

import { configuration, configurationLayout } from "../src/configuration.js";
import { ActivityClock } from "../src/index.js";

let testRadius = 300;

/******************** EMPTY VARIABLES ********************/

// initialize
let ac = new ActivityClock();

// TEST INIT //
test("init", t => {

    t.true(ac !== undefined);

});

// TEST get DATA //
test("get_data", t => {

    t.true(typeof(ac.data) == "object");

});

// TEST CONSTRUCTARCS //
test("constructArcs", t => {

    let result = ac.constructArcs(testRadius / 2, testRadius);

    t.true(typeof(result) == "object");
    t.true(result.length == 12);

});

// TEST RENDER //
test("render", t => {

    // clear document
    document.body.innerHTML = "";

    // render to dom
    ac.render(document.body);

    // get generated element
    let artboard = document.querySelector(`.${configuration.name}`);

    t.true(artboard !== undefined);
    t.true(artboard.nodeName == "svg");

});

/******************** DECLARED PARAMS ********************/

let testData = [
    {
        "timestamp": "2021-07-31T16:05:55-04:0",
        "value": 1
    },
    {
        "timestamp": "2021-07-31T18:05:55-04:0",
        "value": 3
    },
    {
        "timestamp": "2021-07-31T16:10:55-04:0",
        "value": 2
    }
];
testRadius = 124;

// initialize
let ack = new ActivityClock();

// TEST INIT //
test("init_params", t => {

    t.true(ack !== undefined);

});

// TEST get DATA //
test("get_data_params", t => {

    t.true(typeof(ack.data) == "object");

});

// TEST CONSTRUCTARCS //
test("constructArcs_params", t => {

    let result = ack.constructArcs(testRadius / 2, testRadius);

    t.true(typeof(result) == "object");
    t.true(result.length == 12);

});

// TEST RENDER //
test("render_params", t => {

    // clear document
    document.body.innerHTML = "";

    // render to dom
    ack.render(document.body);

    // get generated element
    let artboard = document.querySelector(`.${configuration.name}`);

    t.true(artboard !== undefined);
    t.true(artboard.nodeName == "svg");

});
