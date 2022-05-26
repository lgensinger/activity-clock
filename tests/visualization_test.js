import test from "ava";
import moment from "moment";

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

// TEST CONSTRUCTANGLE //
test("constructAngle", t => {

    let result = ac.constructAngle(Math.floor(Math.random() * 12));

    t.true(typeof(result) == "object");

});

// TEST CONSTRUCTARCS //
test("constructArcs", t => {

    let result = ac.constructArcs("am");

    t.true(typeof(result) == "object");
    t.true(result.length == 12);

    result = ac.constructArcs("pm");

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

let testData = [...Array(Math.floor(Math.random() * (100 - 1) + 1)).keys()].map(d => ({
    timestamp: moment().add(Math.floor(Math.random() * (24 - 1) + 1), "hours").format(),
    value: Math.floor(Math.random() * (100 - 1) + 1)
}));

testRadius = 124;

// initialize
let ack = new ActivityClock(testData, testRadius);

// TEST INIT //
test("init_params", t => {

    t.true(ack !== undefined);

});

// TEST get DATA //
test("get_data_params", t => {

    t.true(typeof(ack.data) == "object");

});

// TEST CONSTRUCTANGLE //
test("constructAngle_params", t => {

    let result = ack.constructAngle(Math.floor(Math.random() * 12));

    t.true(typeof(result) == "object");

});

// TEST CONSTRUCTARCS //
test("constructArcs_params", t => {

    let result = ack.constructArcs("am");

    t.true(typeof(result) == "object");
    t.true(result.length == 12);

    result = ack.constructArcs("pm");

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