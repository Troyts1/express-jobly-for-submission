
"use strict";

const db = require("../db");
const { NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");


  // this is creating a new job query and being used submittd by a router
class Job {
  static async create(data) {
    const result = await db.query(
      `INSERT INTO jobs (title, salary, equity, company_handle)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [data.title, data.salary, data.equity, data.companyHandle]
    );
    let job = result.rows[0];
    return job;
  }

    //creating a query for retreive all info on a job lsiting and passing
    // query to a router
  static async findAll({ minSalary, hasEquity, title } = {}) {
    let query = `SELECT j.id, j.title, j.salary, j.equity, j.company_handle AS "companyHandle",
                        c.name AS "companyName" 
                 FROM jobs AS j
                 LEFT JOIN companies AS c ON c.handle = j.company_handle`;
    let whereExpressions = [];
    let queryValues = [];

    // If there is a title inputted, this pushes the title to the queryValues and
    // the WHERE expression to the whereExpressions array
    if (title !== undefined) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`title ILIKE $${queryValues.length}`);
    }

    // If there is a minimum salary inputted, this pushes the minimum salary to the queryValues and
    // the WHERE expression to the whereExpressions array
    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`salary >= $${queryValues.length}`);
    }

    // If equity is present, this adds the WHERE expression to the whereExpressions array
    if (hasEquity === true) {
      whereExpressions.push(`equity > 0`);
    }

    // This appends the WHERE clause to the query string and 
    // joins each condition with an AND
    if (whereExpressions.length > 0) {
      query += " WHERE " + whereExpressions.join(" AND ");
    }

    // This orders by title and returns the data to the user
    query += " ORDER BY title";
    const res = await db.query(query, queryValues);
    return res.rows;
  }

  // Given a job id, return data about job.
  // passing data to a router
  static async get(id) {
    const jobResponse = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs 
       WHERE id = $1`, [id]);
  
    const job = jobResponse.rows[0];
  
    // If the job ID is not found, throw a NotFoundError
    if (!job) throw new NotFoundError(`No job: ${id}`);

    const companies = await db.query(
      `SELECT handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`, [job.companyHandle]);
  
    // Delete the companyHandle from the job object to avoid redundancy
    delete job.companyHandle;
  
    // Add the company details to the job object
    job.company = companies.rows[0];
  
    return job;
  }


 // This gets a job by the input ID.
static async get(id) {
    const jobIdSearch = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = $1`, [id]);
  
    const job = jobIdSearch.rows[0];
    // Throws an express error if the job ID is not found.
    if (!job) throw new NotFoundError(`${id} not found`);
    // Searches for the company matching the job's company handle.
    const companiesRes = await db.query(
          `SELECT handle, name, description, num_employees AS "numEmployees",
           logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`, [job.companyHandle]);
    // Deletes the company handle to avoid duplicate handles in the response.
    delete job.companyHandle;
    job.company = companiesRes.rows[0];
  
    return job;
  }
  
  // Update job data with `data`.
  // This is a "partial update" --- it's fine if data doesn't contain
  // Data can include: { title, salary, equity }
  // Returns { id, title, salary, equity, companyHandle }
  static async update(id, data) {
    // This retrieves the setCols and values from the sqlForPartialUpdate function
    const { setCols, values } = sqlForPartialUpdate(data, {});
    // Assigns an index position for the placeholder for the id
    const idIdx = "$" + (values.length + 1);
    // Dynamically places the setCols data and the placeholder into the query
    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${idIdx} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    // Executes the SQL query and adds the values and id at the end of the query
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    // If no job is found, throw a NotFoundError
    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }

  // Delete given job from database; returns undefined.
  // Throws NotFoundError if company not found.
  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs WHERE id = $1 RETURNING id`, [id]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${id}`);

    return job;
  }
}

module.exports = Job;