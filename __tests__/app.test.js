const db = require("../db/connection.js");
const seed = require("../db/seeds/seed.js");
const testData = require("../db/data/test-data/index.js");
const request = require("supertest");
const app = require("../app.js");
require("jest-sorted");

beforeEach(() => {
  return seed(testData);
});

afterAll(() => {
  if (db.end) db.end();
});

describe("GET: /api/categories", () => {
  it("Should return an array of 4 objects with 2 keys each", () => {
    return request(app)
      .get("/api/categories")
      .expect(200)
      .then((result) => {
        expect(result.body.categories).toHaveLength(4);
        result.body.categories.forEach((category) => {
          expect(category).toHaveProperty("slug", expect.any(String));
          expect(category).toHaveProperty("description", expect.any(String));
        });
      });
  });
});
describe("errors", () => {
  it("should return an error message if there is an spelling error in the endpoint", () => {
    return request(app)
      .get("/api/caetgories")
      .expect(404)
      .then(({ body }) => {
        expect(body.msg).toBe("Invalid input");
      });
  });
});

describe("GET: /api/reviews/:review_id", () => {
  it("should return the review asked for in the get request", () => {
    return request(app)
      .get("/api/reviews/1")
      .expect(200)
      .then(({ body }) => {
        expect(body.review).toHaveProperty("review_id", 1);
        expect(body.review).toHaveProperty("title", expect.any(String));
        expect(body.review).toHaveProperty("category", expect.any(String));
        expect(body.review).toHaveProperty("designer", expect.any(String));
        expect(body.review).toHaveProperty("owner", expect.any(String));
        expect(body.review).toHaveProperty("review_body", expect.any(String));
        expect(body.review).toHaveProperty(
          "review_img_url",
          expect.any(String)
        );
        expect(body.review).toHaveProperty("created_at", expect.any(String));
        expect(body.review).toHaveProperty("votes", expect.any(Number));
      });
  });
  it("should return a count of the comments on each review", () => {
    return request(app)
      .get("/api/reviews/1")
      .expect(200)
      .then(({ body }) => {
        expect(body.review).toHaveProperty("comment_count", 0);
      });
  });
  it("should return an error message when there is a request for an invalid review_id", () => {
    return request(app)
      .get("/api/reviews/1000")
      .expect(404)
      .then((result) => {
        expect(result.text).toInclude("No review found for review_id:");
      });
  });
  it("should return an error message when there is a request for an invalid review_id", () => {
    return request(app)
      .get("/api/reviews/review")
      .expect(400)
      .then((result) => {
        expect(result.text).toInclude("invalid request");
      });
  });
});
describe("GET /api/reviews", () => {
  it("should return a reviews array of review objects with comment count", () => {
    return request(app)
      .get("/api/reviews")
      .expect(200)
      .then(({ body }) => {
        expect(body.reviews).toHaveLength(13);
        body.reviews.forEach((review) => {
          expect(review).toHaveProperty("review_id");
          expect(review).toHaveProperty("title", expect.any(String));
          expect(review).toHaveProperty("category", expect.any(String));
          expect(review).toHaveProperty("designer", expect.any(String));
          expect(review).toHaveProperty("owner", expect.any(String));
          expect(review).toHaveProperty("review_body", expect.any(String));
          expect(review).toHaveProperty("created_at", expect.any(String));
          expect(review).toHaveProperty("votes", expect.any(Number));
          expect(review).toHaveProperty("comment_count");
        });
      });
  });
  it("should return reviews sorted by date in descending order", () => {
    return request(app)
      .get("/api/reviews")
      .then((result) => {
        expect(result.body.reviews).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
  it("should return reviews by category", () => {
    return request(app)
      .get("/api/reviews?category=euro+game")
      .expect(200)
      .then((result) => {
        result.body.reviews.forEach((review) => {
          expect(review.category).toBe("euro game");
        });
      });
  });
  it("should accept multiple queries and return the appropriate data", () => {
    return request(app)
      .get("/api/reviews?category=social+deduction&sort_by=owner&order=DESC")
      .expect(200)
      .then((result) => {
        result.body.reviews.forEach((entry) => {
          expect(entry.category).toBe("social deduction");
        });
        expect(result.body.reviews).toBeSortedBy("owner", {
          descending: true,
        });
      });
  });
  it("400: should reject invalid queries", () => {
    return request(app)
      .get(
        "/api/reviews?category=social+deduction&sort_by=wrong+info&order=DESC"
      )
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("bad request");
      });
  });
  it("should return 404 when queried with an invalid category", () => {
    return request(app)
      .get("/api/reviews?category=hacker&sort_by=owner&order=DESC")
      .expect(404)
      .then((result) => {
        expect(result.body.msg).toBe("category not found");
      });
  });
  it("should return 200 when queried with a valid category, but no reviews exist", () => {
    return request(app)
      .get("/api/reviews?category=children's+games&sort_by=owner&order=DESC")
      .expect(200)
      .then((result) => {
        expect(result.body.msg).toBe("no reviews for this category");
      });
  });
  it("should return 400 when queried with an invalid sort by", () => {
    return request(app)
      .get(
        "/api/reviews?category=social+deduction&sort_by=nonexistent&order=DESC"
      )
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("bad request");
      });
  });
});
describe("GET: /api/reviews/:review_id/comments", () => {
  it("should return the comments for the inputted review", () => {
    return request(app)
      .get("/api/reviews/2/comments")
      .then((result) => {
        const { comments } = result.body;
        expect(comments).toHaveLength(3);
      });
  });
  it("should include the following properties", () => {
    return request(app)
      .get("/api/reviews/2/comments")
      .then((result) => {
        const { comments } = result.body;
        comments.forEach((comment) => {
          expect(comment).toHaveProperty("comment_id", expect.any(Number));
          expect(comment).toHaveProperty("body", expect.any(String));
          expect(comment).toHaveProperty("review_id", 2);
          expect(comment).toHaveProperty("author", expect.any(String));
          expect(comment).toHaveProperty("votes", expect.any(Number));
          expect(comment).toHaveProperty("created_at", expect.any(String));
        });
      });
  });
  it("should return results in order of most recent comments first", () => {
    return request(app)
      .get("/api/reviews/2/comments")
      .then((result) => {
        const { comments } = result.body;
        expect(comments).toBeSortedBy("created_at", {
          descending: true,
        });
      });
  });
  it("should return an error message when there is a request for an invalid review_id", () => {
    return request(app)
      .get("/api/reviews/review/comments")
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toInclude("invalid request");
      });
  });
  it("should return 200 for an article that exists but has no comments", () => {
    return request(app)
      .get("/api/reviews/1/comments")
      .expect(200)
      .then((result) => {
        expect(result.body.msg).toInclude("No comments found for review_id:");
      });
  });
});

describe("POST: /api/reviews/:review_id/comments", () => {
  it("should post a comment to a review", () => {
    const comment = { username: "mallionaire", body: "This is a test comment" };

    return request(app)
      .post("/api/reviews/1/comments")
      .send(comment)
      .expect(201)
      .then((result) => {
        const { comment } = result.body;
        expect(comment).toHaveProperty("comment_id", expect.any(Number));
        expect(comment).toHaveProperty("body", "This is a test comment");
        expect(comment).toHaveProperty("review_id", 1);
        expect(comment).toHaveProperty("author", "mallionaire");
        expect(comment).toHaveProperty("votes", 0);
        expect(comment).toHaveProperty("created_at", expect.any(String));
      });
  });
  it("should return a 404 error if a valid review id but id doesn't exist", () => {
    const comment = { username: "mallionaire", body: "This is a test comment" };

    return request(app)
      .post("/api/reviews/1000/comments")
      .send(comment)
      .expect(404)
      .then((result) => {
        expect(result.body.msg).toBe("review doesn't exist");
      });
  });
  it("should return a 400 error if the user attempts to post to an invalid review", () => {
    const comment = { username: "mallionaire", body: "This is a test comment" };

    return request(app)
      .post("/api/reviews/banana/comments")
      .send(comment)
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("invalid request");
      });
  });
  it("should return a 400 error if the user attempts to post to a review and is not a user", () => {
    const comment = { username: "connor", body: "This is a test comment" };

    return request(app)
      .post("/api/reviews/1/comments")
      .send(comment)
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("invalid user");
      });
  });
  it("should return a 400 error if the user attempts to post a review without a review body", () => {
    const comment = { username: "mallionaire" };

    return request(app)
      .post("/api/reviews/1/comments")
      .send(comment)
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("bad request");
      });
  });
});

describe("PATCH: /api/reviews/:review_id", () => {
  it("should respond with the updated review, with it's votes incremented", () => {
    return request(app)
      .patch("/api/reviews/1")
      .send({ inc_votes: 1 })
      .expect(200)
      .then((result) => {
        expect(result.body.review.votes).toBe(2);
      });
  });
  it("should respond with the updated review, with it's votes decremented", () => {
    return request(app)
      .patch("/api/reviews/1")
      .send({ inc_votes: -100 })
      .expect(200)
      .then((result) => {
        expect(result.body.review.votes).toBe(-99);
      });
  });
  it("should return a 404 error if the user tries to patch to a review that is valid, but doesn't exist", () => {
    return request(app)
      .patch("/api/reviews/1000")
      .send({ inc_votes: 2 })
      .expect(404)
      .then((result) => {
        expect(result.body.msg).toBe("This review does not exist");
      });
  });
  it("should return a 400 error if the user tries to patch to an invalid review", () => {
    return request(app)
      .patch("/api/reviews/hello")
      .send({ inc_votes: 1 })
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toInclude("invalid request");
      });
  });
  it("should return 400 if the user input is incorrect", () => {
    return request(app)
      .patch("/api/reviews/1")
      .send({ votes: 1 })
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("bad request");
      });
  });
  it("should return 400 if the votes value is not a number", () => {
    return request(app)
      .patch("/api/reviews/1")
      .send({ inc_votes: "ten" })
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("invalid request");
      });
  });
});

describe("DELETE /api/comments/:comment_id", () => {
  it("Should delete a comment by given id", () => {
    return request(app)
      .delete("/api/comments/1")
      .expect(204)
      .then((result) => {});
  });
  it("should return a 404 error if the user tries to delete a comment that doesn't exist", () => {
    return request(app)
      .delete("/api/comments/1000")
      .expect(404)
      .then((result) => {
        expect(result.body.msg).toBe("This comment does not exist");
      });
  });
  it("should return a 400 error if the user tries to delete a comment that doesn't exist", () => {
    return request(app)
      .delete("/api/comments/banana")
      .expect(400)
      .then((result) => {
        expect(result.body.msg).toBe("invalid request");
      });
  });
});

describe("GET /api/users", () => {
  it("should return an array of user objects", () => {
    return request(app)
      .get("/api/users")
      .expect(200)
      .then((result) => {
        const { users } = result.body;
        expect(users).toHaveLength(4);
        users.forEach((user) => {
          expect(user).toHaveProperty("username", expect.any(String));
          expect(user).toHaveProperty("name", expect.any(String));
          expect(user).toHaveProperty("avatar_url", expect.any(String));
        });
      });
  });
  it("should return an error if the get request is spelled wrong", () => {
    return request(app)
      .get("/api/uers")
      .expect(404)
      .then((result) => {
        expect(result.body.msg).toBe("Invalid input");
      });
  });
});
describe("GET /api", () => {
  it("should respond with a json guide to use the app", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then((result) => {});
  });
});
