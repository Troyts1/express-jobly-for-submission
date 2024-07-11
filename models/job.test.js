
"use strict";

const { NotFoundError, BadRequestError } = require("../expressError");
const db = require("../db.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

//************************** create ****************************


describe("create", function () {

  test(" creating a new job", async function () {
    let newJob = {
      companyHandle: "c1",
      title: "Test",
      salary: 200,
      equity: "0.1",
    };
    let job = await Job.create(newJob);
    expect(job).toEqual({...newJob,id: expect.any(Number),
    });
  });
});


//************************** find all ****************************


  describe("find all", function(){
    test("find all jobs W/O filter", async function(){
      let job = await Job.findAll();

      expect(job).toEqual([

        {
          id: testJobIds[0],
          title: "Job1",
          salary: 100,
          equity: "0.1",
          companyHandle: "c1",
          companyName: "C1",
      },
        {
          id: testJobIds[1],
          title: "Job2",
          salary: 200,
          equity: "0.2",
          companyHandle: "c1",
          companyName: "C1",
      },
        {
          id: testJobIds[2],
          title: "Job3",
          salary: 300,
          equity: "0",    
          companyHandle: "c1",
          companyName: "C1",
      },
        {
          id: testJobIds[3],
          title: "Job4",
          salary: null,
          equity: null,
          companyHandle: "c1",
          companyName: "C1",      
        },
      ]);
    });


  test("search by min salary", async function(){
    let jobs = await Job.findAll({ minSalary: 275});
    expect(jobs).toEqual([
      {
        id: testJobIds[2],
        title: "Job3",
        salary: 300,
        equity: "0",
        companyHandle: "c1",
        companyName: "C1",
      },
    ]);
  });

 
  test("works: by equity", async function () {
    let jobs = await Job.findAll({ hasEquity: true });
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[1],
        title: "Job2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1",
        companyName: "C1",
      },
    ]);
  });

  

  test("searching jobs having equity", async function() {
    let jobs = await Job.findAll({ hasEquity: true });
  
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      },
      {
        id: testJobIds[1],
        title: "Job2",
        salary: 200,
        equity: "0.2",
        companyHandle: "c1",
        companyName: "C1",
      },
    ]);
  });


  test("searches by name", async function() {
    let jobs = await Job.findAll({ title: "Job1" });
  
    expect(jobs).toEqual([
      {
        id: testJobIds[0],
        title: "Job1",
        salary: 100,
        equity: "0.1",
        companyHandle: "c1",
        companyName: "C1",
      },
    ]);
  });
});



//************************** get by id ****************************

test("gets company by id", async function () {
  let job = await Job.get(testJobIds[0]);
  expect(job).toEqual({
    id: testJobIds[0],
    title: "Job1",
    salary: 100,
    equity: "0.1",
    company: {
      handle: "c1",
      name: "C1",
      description: "Desc1", 
      logoUrl: "http://c1.img", 
      numEmployees: 1, 
    }
  });
});


test("id not found", async function () {
  try {
    let job = await Job.get(111); 
    fail(); 
  } catch (err) {
    expect(err instanceof NotFoundError).toBeTruthy();
  }
});


//************************** update ****************************

describe("updating job", function(){


    let updateData = {
      title: "NewTitle",
      salary: 1000,   
      equity: "0.25", 
    };
    
    test("update job", async function(){
      let job = await Job.update(testJobIds[0], updateData);
      expect(job).toEqual({
        id: testJobIds[0],
        companyHandle: "c1",
        ...updateData,
      });
    });
    
    test("test for no job found", async function(){
      try {
        await Job.update(testJobIds[22], {
          title: "test",
        });
        fail(); 
      } catch (err) {
        expect(err instanceof NotFoundError).toBeTruthy();
      }
    });
    

    test("bad resuest", async function(){
      try{
        await Job.update(testJobIds[0], {});
        fail();
      }
      catch(err){
      expect(err instanceof BadRequestError).toBeTruthy();
      }
    })
  });



//************************** remove ****************************


describe("remove", function () {
  test("deletes jobs", async function () {
    await Job.remove(testJobIds[0]);
    const res = await db.query(
      `SELECT id FROM jobs WHERE id=$1`,
      [testJobIds[0]]
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

  