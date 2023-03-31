const db = require("../connection.js");

exports.fetchReviews = (query) => {
  const queryParameters = [];
  let category = "";
  let sort_by = "";
  let order = "";
  if (query) {
    category = query.category;
    sort_by = query.sort_by;
    order = query.order;
  }

  const categoryGreenList = ["euro game", "dexterity", "social deduction"];
  const sortByGreenList = [
    "title",
    "designer",
    "owner",
    "review_img_url",
    "review_body",
    "category",
    "created_at",
    "votes",
  ];
  const orderGreenList = ["ASC", "DESC"];

  let fetchReviewsQueryString = `SELECT reviews.*, COUNT(comments.review_id) AS comment_count FROM reviews LEFT JOIN comments on reviews.review_id = comments.review_id`;

  if (category !== undefined) {
    let isValidCategory = false;
    categoryGreenList.forEach((entry) => {
      if (entry === category) isValidCategory = true;
    });
    if (isValidCategory === true) {
      fetchReviewsQueryString += ` WHERE reviews.category = '${category}'`;
    } else {
      return Promise.reject({ status: 400, msg: `bad request` });
    }
  }

  if (sort_by !== undefined) {
    let isValidSortBy = false;
    sortByGreenList.forEach((entry) => {
      if (entry === sort_by) isValidSortBy = true;
    });
    if (isValidSortBy === true) {
      fetchReviewsQueryString += ` GROUP BY reviews.review_id ORDER BY ${sort_by}`;
    } else {
      return Promise.reject({ status: 400, msg: `bad request` });
    }
  } else {
    fetchReviewsQueryString += ` GROUP BY reviews.review_id ORDER BY reviews.created_at`;
  }

  if (order !== undefined) {
    let isValidOrder = false;
    orderGreenList.forEach((entry) => {
      if (entry === order.toUpperCase()) isValidOrder = true;
    });
    if (isValidOrder === true) {
      fetchReviewsQueryString += ` ${order};`;
    } else {
      return Promise.reject({ status: 400, msg: `bad request` });
    }
  } else {
    fetchReviewsQueryString += ` DESC;`;
  }

  return db.query(fetchReviewsQueryString, queryParameters).then((result) => {
    return result.rows;
  });
};

exports.fetchReviewsById = (review_id) => {
  let fetchReviewsQueryString = "SELECT * FROM reviews";
  const queryParameters = [];

  fetchReviewsQueryString += ` WHERE review_id = $1`;
  queryParameters.push(review_id);

  return db.query(fetchReviewsQueryString, queryParameters).then((result) => {
    if (result.rows.length === 0) {
      return Promise.reject({
        status: 404,
        msg: `No review found for review_id: ${review_id}`,
      });
    }
    return result.rows;
  });
};

exports.updateReviewVotes = (req) => {
  const { inc_votes } = req.body;
  const { review_id } = req.params;
  return db
    .query(
      `UPDATE reviews
    SET votes = votes + $1 
    WHERE review_id = $2 RETURNING *;`,
      [inc_votes, review_id]
    )
    .then((result) => {
      return result.rows[0];
    });
};

exports.checkReviewExists = async (review_id) => {
  const dbOutput = await db.query(
    "SELECT * FROM reviews WHERE review_id = $1;",
    [review_id]
  );
  if (dbOutput.rows.length === 0) {
    // resource does NOT exist
    return Promise.reject({ status: 404, msg: `This review does not exist` });
  }
};
