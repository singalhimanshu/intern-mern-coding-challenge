const express = require("express");
const app = express();
const port = 3000;
const fs = require("fs");
const cors = require("cors");

app.use(cors());

const mongoose = require("mongoose");
mongoose
  .connect("mongodb://127.0.0.1:27017/mern")
  .then((somethign) => {
    console.log("SUCCESS");
  })
  .catch((e) => {
    console.log("failure");
    console.log(e);
  });

const Transactions = mongoose.model("transactions", {
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date,
});

Transactions.schema.index({ title: "text", description: "text" });

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/init", (req, res) => {
  const productJsonPath =
    "/home/himanshu/repos/yt/coding-challenges/mern-intern-challenge/product_transaction.json";
  fs.readFile(productJsonPath, "utf8", (err, data) => {
    if (err) {
      console.log("Error reading the file:", err);
      return;
    }
    const productJsonList = JSON.parse(data);
    for (const key in productJsonList) {
      const productJson = productJsonList[key];
      const productJsonDBEntry = new Transactions(productJson);
      console.log(productJsonDBEntry);
      // TODO(optimize): do bulk save rather than saving each item
      // TODO: should we upsert here?
      productJsonDBEntry.save((err) => {
        if (err) {
          console.error("Error saving instance:", err);
          return;
        }
        console.log("Saved successfully, id:", productJsonDBEntry["id"]);
      });
    }
  });
  res.send("");
});

app.get("/transactions", async (req, res) => {
  const offset = parseInt(req.query.offset) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const searchQuery = req.query.q || "";
  console.log("searchQuery:", searchQuery);
  const month = parseInt(req.query.month) || 3;
  console.log("month:", month);
  // TODO: validate that offset is >= 1
  const skip = (offset - 1) * limit;
  const query = { $expr: { $eq: [{ $month: "$dateOfSale" }, month] } };
  if (searchQuery !== "") {
    query["$or"] = [
      { $text: { $search: searchQuery } },
      // {category: {$regex: searchQuery}}
    ];
  }
  console.log("query:", query);
  const transactions = await Transactions.find(query).limit(limit).skip(skip);
  res.json({ response: transactions });
});

app.get("/stats", async (req, res) => {
  const month = parseInt(req.query.month) || 3;
  const type = req.query.type;
  const matchMonth = { $expr: { $eq: [{ $month: "$dateOfSale" }, month] } };
  if ("text" === type) {
    res.json({
      response: {
        ...(await getTextStats(matchMonth)),
      },
    });
  } else if ("bar" === type) {
    res.json({
      repsonse: {
        ...(await getBarStats(matchMonth)),
      },
    });
  } else if ("pie" === type) {
    res.json({
      response: {
        ...(await getPieStats(matchMonth)),
      },
    });
  } else {
    const textResponse = await getTextStats(matchMonth);
    const barResponse = await getBarStats(matchMonth);
    const pieResposne = await getPieStats(matchMonth);
    res.json({
      response: {
        textResponse: textResponse,
        barResponse: barResponse,
        pieResponse: pieResposne,
      },
    });
  }
});

const getTextStats = async (matchMonth) => {
  // TODO: try/catch block and handle errors
  console.log("hi");
  let totalSalesByMonth = await Transactions.aggregate([
    { $match: matchMonth },
    { $project: { price: 1 } },
    { $group: { _id: "_id", totalSales: { $sum: "$price" } } },
    { $project: { totalSales: 1, _id: 0 } },
  ]);
  if (totalSalesByMonth) {
    totalSalesByMonth = totalSalesByMonth[0]["totalSales"];
  }

  const totalSalesByMonthGroupByCategory = await Transactions.aggregate([
    { $match: matchMonth },
    { $project: { price: 1, category: 1 } },
    { $group: { _id: "$category", totalSales: { $sum: "$price" } } },
    { $project: { category: "$_id", totalSales: 1, _id: 0 } },
  ]);

  let itemsSoldByMonth = await Transactions.aggregate([
    { $match: { sold: true, ...matchMonth } },
    { $project: { sold: 1 } },
    { $group: { _id: "$sold", totalCount: { $sum: 1 } } },
    { $project: { totalCount: 1, _id: 0 } },
  ]);
  if (itemsSoldByMonth) {
    itemsSoldByMonth = itemsSoldByMonth[0]["totalCount"];
  }

  let itemsNotSoldByMonth = await Transactions.aggregate([
    { $match: { sold: false, ...matchMonth } },
    { $project: { sold: 1 } },
    { $group: { _id: "$sold", totalCount: { $sum: 1 } } },
    { $project: { totalCount: 1, _id: 0 } },
  ]);
  if (itemsNotSoldByMonth) {
    itemsNotSoldByMonth = itemsNotSoldByMonth[0]["totalCount"];
  }
  return {
    totalSalesByMonth: totalSalesByMonth,
    totalSalesByMonthGroupByCategory: totalSalesByMonthGroupByCategory,
    itemSoldByMonth: itemsSoldByMonth,
    itemsNotSoldByMonth: itemsNotSoldByMonth,
  };
};

const getBarStats = async (matchMonth) => {
  // @@@todo: define ranges in code
  const ranges = [
    {
      low: 0,
      high: 100,
    },
    {
      low: 101,
      high: 200,
    },
    {
      low: 201,
      high: 300,
    },
    {
      low: 301,
      high: 400,
    },
    {
      low: 401,
      high: 500,
    },
    {
      low: 501,
      high: 600,
    },
    {
      low: 601,
      high: 700,
    },
    {
      low: 701,
      high: 800,
    },
    {
      low: 801,
      high: 600,
    },
    {
      low: 901,
      high: Infinity,
    },
  ];
  const branches = ranges.map((range) => {
    return {
      case: {
        $and: [
          { $gte: ["$price", range.low] },
          { $lte: ["$price", range.high] },
        ],
      },
      then: `${range.low}-${range.high}`,
    };
  });
  const priceAggregate = {
    $group: {
      _id: {
        $switch: {
          branches: branches,
          default: "Unknown",
        },
      },
      count: { $sum: 1 },
    },
  };
  let priceAggregationResult = await Transactions.aggregate([
    { $match: matchMonth },
    priceAggregate,
    {
      $project: {
        _id: 1,
        count: { $ifNull: ["$count", 0] },
      },
    },
  ]);
  console.log(priceAggregationResult);
  let priceAggregationResponseMap = {};
  for (const key in priceAggregationResult) {
    const range = priceAggregationResult[key]["_id"];
    const count = priceAggregationResult[key]["count"];
    priceAggregationResponseMap[range] = count ? count : 0;
  }
  let priceAggregationResponse = [];
  for (let i = 0; i < ranges.length; i++) {
    const range = ranges[i];
    const key = `${range.low}-${range.high}`;
    const rangeVal = priceAggregationResponseMap[key]
      ? priceAggregationResponseMap[key]
      : 0;
    priceAggregationResponse.push({
      range: `${range.low}-${range.high}`,
      count: rangeVal,
    });
  }
  return priceAggregationResponse;
};

const getPieStats = async (matchMonth) => {
  const pieResult = await Transactions.aggregate([
    { $match: matchMonth },
    { $project: { category: 1 } },
    { $group: { _id: "$category", totalCount: { $sum: 1 } } },
  ]);
  let pieResponse = [];
  for (const key in pieResult) {
    const category = pieResult[key]["_id"];
    const count = pieResult[key]["totalCount"];
    pieResponse.push({ count, category });
  }
  return pieResponse;
};

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
