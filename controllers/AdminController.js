const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require("../database/connect");


const filePath = path.join(__dirname, 'categories.json');

function readCategories() {
  const data = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(data);
}

function writeCategories(categories) {
  fs.writeFileSync(filePath, JSON.stringify(categories, null, 2), 'utf8');
}

router.get('/category', async (req, res) => {
  try {
    res.status(200).json(readCategories());
  } catch (e) {
    res.status(500).send("Internal Server Error");
  }
});

router.post('/category', async (req, res) => {
  try {
    const newCategory = req.body;
    const categories = readCategories();

    // Assign a new unique ID
    const maxId = categories.reduce((max, category) => (category.id > max ? category.id : max), 0);
    newCategory.id = maxId + 1;

    categories.push(newCategory);
    writeCategories(categories);
    res.status(201).json(newCategory);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});

router.put('/category/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (!name) {
      return res.status(400).send("Name is required");
    }

    const categories = readCategories();
    const category = categories.find(c => c.id === id);

    if (!category) {
      return res.status(404).send("Category not found");
    }

    category.name = name;
    writeCategories(categories);
    
    res.status(200).json(category);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});

router.delete('/category/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const categories = readCategories();
    const categoryExists = categories.some(category => category.id === id);

    if (!categoryExists) {
      return res.status(404).send("Category not found");
    }

    const updatedCategories = categories.filter(category => category.id !== id);
    writeCategories(updatedCategories)
    res.status(204).send();

  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});








router.get('/users', async (req, res) => {
  try {
    const findUser = await pool.execute(
      "SELECT userId, clientID, name, email, mobileNo, isActive, createdAt FROM users");
    if (findUser[0].length === 0) {
      res.status(401).json({ errorMsg: 'No User Exist' });
      return;
    }
    res.status(200).send(findUser[0]);
    return;
  }
  catch (e) {
    console.log(e);
  }
});


router.get('/contact_us_queries', async (req, res) => {
  try {
    const findUser = await pool.execute(
      "SELECT * FROM contactUs");
    if (findUser[0].length === 0) {
      res.status(401).json({ errorMsg: 'No User Exist' });
      return;
    }
    res.status(200).send(findUser[0]);
    return;
  }
  catch (e) {
    console.log(e);
  }
});






router.post('/brokers', async (req, res) => {
  const brokers = req.body; 

    const sql = `
        INSERT INTO brokers (name, link) 
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE 
        link = VALUES(link);
    `;

    try {
        for (const broker of brokers) {
            await pool.query(sql, [broker.name, broker.link]);
        }
        res.status(200).json({ message: 'Brokers updated successfully' });
    } catch (error) {
        console.error('Error updating brokers:', error);
        res.status(500).json({ error: 'Failed to update brokers' });
    }
});




module.exports = router;
