const express = require('express')
const app = express()
const port = 3000
const fs = require('fs')

const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/mern').then((somethign) => {
  console.log("SUCCESS")
}).catch(e => {
  console.log("failure")
  console.log(e);
})

const Transactions = mongoose.model('transactions', {
  id: Number,
  title: String,
  price: Number,
  description: String,
  category: String,
  image: String,
  sold: Boolean,
  dateOfSale: Date
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/init', (req, res) => {
  const productJsonPath = '/home/himanshu/repos/yt/coding-challenges/mern-intern-challenge/product_transaction.json';
  fs.readFile(productJsonPath, 'utf8', (err, data) => {
    if (err) {
      console.log('Error reading the file:', err)
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
        console.log("Saved successfully, id:", productJsonDBEntry['id'])
      })
    }
  })
  res.send('')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})