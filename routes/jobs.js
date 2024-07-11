
"use strict";
const jsonschema = require("jsonschema");
const express = require("express");
const { BadRequestError } = require("../expressError");
const { ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");
const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");
const jobSearchSchema = require("../schemas/jobSearch.json");
const router = express.Router({ mergeParams: true });

//this allows the admin to post new jobs
router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    // this ues a schema validates that data to be in proper format
    const validator = jsonschema.validate(req.body, jobNewSchema);
    // if not valid json and in the proper format, retuns a express error
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    //
    const job = await Job.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});


router.get("/", async function (req, res, next) {
  const q = req.query;
  // arrive as strings from querystring, but we want as int/bool
  if (q.minSalary !== undefined) q.minSalary = +q.minSalary;
  q.hasEquity = q.hasEquity === "true";
  // validates if valid json and if not, return express error
  try {
    const validator = jsonschema.validate(q, jobSearchSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
  // finds jobs using rhw findAll method
    const jobs = await Job.findAll(q);
  // returns data as json
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

// fetches jogs by id
router.get("/:id", async function (req, res, next) {
  try {
    const job = await Job.get(req.params.id);
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// updates a job, searched by id
router.patch("/:id", ensureAdmin, async function(req, res, next) {
  try {
    // Validate the request body using the jobUpdateSchema
    const validator = jsonschema.validate(req.body, jobUpdateSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }
    // Update the job using the ID from the URL parameters and the request body
    const job = await Job.update(req.params.id, req.body);
    // Return the updated job as JSON
    return res.json({ job });
  } catch (err) {
    return next(err);
  }
});

// deletes a job by id, must me a Admin
router.delete("/:id", ensureAdmin, async function(req, res, next) {
  try {
    // Removes a job by passing the ID to the remove method
    await Job.remove(req.params.id);
    // Returns a confirmation message with the deleted job ID as a number
    return res.json({ deleted: +req.params.id });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
