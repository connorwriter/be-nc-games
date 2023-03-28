const { fetchReviews } = require("../models/reviews-model.js");

exports.getReviewsById = (req, res, next) => {
  const { review_id } = req.params;
  fetchReviews(review_id)
    .then((result) => {
      res.status(200).send({ review: result[0] });
    })
    .catch((err) => {
      next(err);
    });
};

exports.getReviews = (req, res, next) => {
  fetchReviews()
    .then((result) => {
      res.status(200).send({ reviews: result });
    })
    .catch((err) => {
      next(err);
    });
};
