
"use strict";

const request = require("supertest");

const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  testJobIds,
  u1Token,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);



//****************************postt jobs *****************************


describe("POST /jobs", function () {

      test("admin posts only", async () => {
        const res = await request(app).post('/jobs')
          .send({
            companyHandle: "c1",
            title: "J-new",
            salary: 10,
            equity: "0.2",
          })
          .set("authorization", `Bearer ${adminToken}`);
        
        expect(res.statusCode).toEqual(201);
        expect(res.body).toEqual({
          job: {
            id: expect.any(Number),
            title: "J-new",
            salary: 10,
            equity: "0.2",
            companyHandle: "c1",
          },
        });
      });
      

  test("test for unauth users", async () => {
    const resp = await request(app)
      .post(`/jobs`).send({
        companyHandle: "c1",
        title: "J-new",
        salary: 10,
        equity: "0.2",
      })
      .set("authorization",`Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });
  

  test("bad request missing data", async () => {
    const resp = await request(app).post(`/jobs`).send({
          companyHandle: "c1",
        })
    .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("invalid data", async ()=> {
    const resp = await request(app)
        .post(`/jobs`).send({
          companyHandle: "c1",
          title: "new job",
          salary: "it doesnt matter",
          equity: "0.5",
        })
        .set("authorization",`Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

});

//**************************** get jobs *****************************

describe("GET/jobs",() => {

  test("get jobs for all users", async () => {
    const resp = await request(app).get(`/jobs`);
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "J1",
              salary: 1,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J2",
              salary: 2,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J3",
              salary: 3,
              equity: null,
              companyHandle: "c1",
              companyName: "C1",
            },
          ],
        },);
  });

  test("job search with filters", async () => {
    const resp = await request(app).get(`/jobs`)
    .query({ hasEquity: true });
    expect(resp.body).toEqual({
          jobs: [
            {
              id: expect.any(Number),
              title: "J1",
              salary: 1,
              equity: "0.1",
              companyHandle: "c1",
              companyName: "C1",
            },
            {
              id: expect.any(Number),
              title: "J2",
              salary: 2,
              equity: "0.2",
              companyHandle: "c1",
              companyName: "C1",
            },
          ],},
    );});

    test("works: filtering on 2 filters", async function () {
      const resp = await request(app)
        .get(`/jobs`)
        .query({ minSalary: 2, title: "J2" });
      
      expect(resp.body).toEqual({
        jobs: [
          {
            id: expect.any(Number),
            title: "J2",
            salary: 2,
            equity: "0.2",
            companyHandle: "c1",
            companyName: "C1",
          }
        ]
      });
    });
    

  test("invalid filter key", async () => {
    const res = await request(app)
      .get('/jobs')
      .query({ minSalary: 5, key: "it doesnt matter" });
    expect(res.statusCode).toEqual(400);
  });
});


//**************************** get jobs with id *****************************

describe("GET /jobs/:id", () => {
  test("search job by id", async () => {
    const res = await request(app).get(`/jobs/${testJobIds[0]}`);
    expect(res.body).toEqual({
      job: {
        id: testJobIds[0],
        title: "J1",
        salary: 1,
        equity: "0.1",
        company: {
          handle: "c1",
          name: "C1",
          description: "Desc1",
          numEmployees: 1,
          logoUrl: "http://c1.img",
        },
      },
    });
  });

  test("no such job found", async () => {
    const res = await request(app).get("/jobs/100");
    expect(res.statusCode).toEqual(404);
  });
});
  

//**************************** update jobs *****************************

describe("PATCH/jobs/:id", () => {

  test("update form admins", async function () {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`).send({
          title: "J-New",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      job:{
        id: expect.any(Number),
        title: "J-New",
        salary: 1,
        equity: "0.1",
        companyHandle: "c1",
      },
    });
  });

  test("attempt update by unauth users", async () => {
    const res = await request(app)
      .patch(`/jobs/${testJobIds[0]}`)
      .send({
        title: "J-New"
      })
      .set("authorization", `Bearer ${u1Token}`);
    expect(res.statusCode).toEqual(401);
  });

  test("no job found", async ()=> {
    const resp = await request(app)
        .patch(`/jobs/0`).send({
          handle: "it doesnt matter",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("invalid data", async ()=> {
    const resp = await request(app)
        .patch(`/jobs/${testJobIds[0]}`)
        .send({
          salary: "letters",
        })
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:id */

describe("DELETE /jobs/:id", function () {
  test("works for admin", async ()=> {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: testJobIds[0] });
  });

  test("unauth for non-admins", async ()=> {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`)
        .set("authorization", `Bearer ${u1Token}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for non users", async ()=> {
    const resp = await request(app)
        .delete(`/jobs/${testJobIds[0]}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("no job found", async () => {
    const res = await request(app)
      .delete("/jobs/0")
      .set("authorization", `Bearer ${adminToken}`);
    
    expect(res.statusCode).toEqual(404); 
  });
})
  