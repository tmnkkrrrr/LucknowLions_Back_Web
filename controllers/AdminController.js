const express = require("express");
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require("../database/connect");
const ftpApi = require ('./FTP/ftpController')

const categoryFilePath = path.join(__dirname, 'categories.json');
const blogsFilePath = path.join(__dirname, 'blogs.json');
const draftBlogsFilePath = path.join(__dirname, 'draft_blogs.json');



function readCategories() {
  const data = fs.readFileSync(categoryFilePath, 'utf8');
  return JSON.parse(data);
}

function writeCategories(categories) {
  fs.writeFileSync(categoryFilePath, JSON.stringify(categories, null, 2), 'utf8');
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
    const updatedCategory = req.body;
    console.log(updatedCategory);

    if (!updatedCategory.name) return res.status(400).send("Name is required");


    const categories = readCategories();
    const category = categories.find(c => c.id === id);

    if (!category) return res.status(404).send("Category not found");

    Object.assign(category, updatedCategory);
    category.id = id;

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



function readBlogs(type) {
  let data;

  switch (type.toLowerCase()) {
    case 'publish': {
      try {
        data = fs.readFileSync(blogsFilePath, 'utf8');
      } catch (error) {
        console.error('Error reading publish file:', error);
      }
      break;
    }
    case 'draft': {
      try {
        data = fs.readFileSync(draftBlogsFilePath, 'utf8');
      } catch (error) {
        console.error('Error reading draft file:', error);
      }
      break;
    }
    default: {
      console.log('Invalid type provided:', type);
    }
  }

  return data ? JSON.parse(data) : null;
}

function writeBlogs(blogs, type) {
  switch (type) {
    case 'publish': {
      fs.writeFileSync(blogsFilePath, JSON.stringify(blogs, null, 2), 'utf8');
      break;
    }
    case 'draft': {
      fs.writeFileSync(draftBlogsFilePath, JSON.stringify(blogs, null, 2), 'utf8');
      break;
    }
  }
}

router.get('/blogs/:type', async (req, res) => {
  try {
    if (req.params.type === undefined) res.status(400).send('Can not Find Blogs');

    res.status(200).json(readBlogs(req.params.type));
  } catch (e) {
    res.status(500).send("Internal Server Error");
  }
});




router.put('/blog', async (req, res) => {
  try {
    const { title, type } = req.body;
    const id = parseInt(req.body.id, 10);

    if (!title) return res.status(400).send("Title is required");
    if (!id) return res.status(400).send("ID is required");
    if (!type) return res.status(400).send("Type is required");

    const blogs = readBlogs(type);
    const blog = blogs.find(b => b.id === id);

    if (!blog) return res.status(404).send("Blog not found");

    // Update title and modifiedAt timestamp
    blog.title = title;
    blog.modifiedAt = new Date().toISOString();

    writeBlogs(blogs, type);
    res.status(200).json(blog);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});

router.delete('/blog', async (req, res) => {
  try {
    const { id, type } = req.body;
    const parsedId = parseInt(id, 10);

    if (!id || isNaN(parsedId)) return res.status(400).send("Invalid blog ID");
    if (!type) return res.status(400).send("Invalid type");

    const blogs = readBlogs(type);
    const blogExists = blogs.some(blog => blog.id === parsedId);

    if (!blogExists) return res.status(404).send("Blog not found");

    const updatedBlogs = blogs.filter(blog => blog.id !== parsedId);
    writeBlogs(updatedBlogs, type)
    res.status(204).send();
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});


router.get('/page/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const saveType = req.query.saveType;

    if (isNaN(id)) return res.status(400).send("Invalid ID format");

    const blogs = readBlogs(saveType);
    console.log(blogs)
    const blog = blogs.find(b => b.id === id);

    if (!blog) return res.status(404).send("Blog not found");

    res.status(200).json(blog);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});


router.post('/blog', async (req, res) => {
  try {
    const { title, pageUrl, content, selectedCategories, seoDetails, ogData, isHidden, auther, blogTags, saveType } = req.body;

    if (!title || !pageUrl || !content || !saveType) {
      return res.status(422).json({
        error: "Missing required fields"
      });
    }

    const blogs = readBlogs(saveType);

    if (blogs.some(blog => blog.pageUrl === pageUrl)) {
      return res.status(409).json({
        error: "Page URL already exists",
        pageUrl
      });
    }

    const maxId = blogs.length === 0 ? 0 : Math.max(...blogs.map(blog => blog.id));

    const newBlog = {
      id: maxId + 1,
      title,
      pageUrl,
      content,
      seoDetails: seoDetails || {},
      ogData: ogData || {},
      auther: auther || "",
      isHidden: isHidden || false,
      blogTags: blogTags || "",
      selectedCategories: selectedCategories || [],
      saveType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };


    blogs.push(newBlog);
    writeBlogs(blogs, saveType);

    res.status(201).json({ responce: 'success', id: maxId + 1 });
  } catch (e) {
    console.error("Error creating new page:", e);
    res.status(500).json({
      error: "Internal Server Error",
      message: e.message
    });
  }
});


router.put('/page/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { title, pageUrl, content, seoDetails, ogData, auther, isHidden, blogTags, selectedCategories, createdAt, saveType } = req.body;

    const blogs = readBlogs(saveType) || [];
    let blog = blogs.find(b => b.id === id);

    if (!blog) {
      blog = {
        id, title, pageUrl, content, seoDetails, ogData, auther, isHidden, blogTags, selectedCategories, createdAt
      };
      blogs.push(blog);

    } else {
      if (title) blog.title = title;
      if (pageUrl) blog.pageUrl = pageUrl;
      if (content) blog.content = content;
      if (seoDetails) blog.seoDetails = seoDetails;
      if (ogData) blog.ogData = ogData;
      if (auther) blog.auther = auther;
      if (isHidden != undefined) blog.isHidden = isHidden;
      if (blogTags) blog.blogTags = blogTags;
      if (selectedCategories) blog.selectedCategories = selectedCategories;
    }
    blog.updatedAt = new Date().toISOString();

    writeBlogs(blogs, saveType);

    res.status(200).json(blog);
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});



router.get('/category_blogs/:name', async (req, res) => {
  try {
    const categoryName = req.params.name;

    // Read categories and blogs
    const categories = readCategories();
    const blogs = readBlogs('publish');
    console.log()


    // Find category ID by name
    const category = categories.find(cat =>
      cat.slug.toLowerCase() === categoryName.toLowerCase()
    );
    console.log(category)


    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    console.log(category)


    // Filter blogs by category ID
    const filteredBlogs = blogs.filter(blog => {
      return blog.selectedCategories &&
        Array.isArray(blog.selectedCategories) &&
        blog.selectedCategories.includes(category.id);
    });

    console.log(filteredBlogs.length)

    return res.status(200).json({
      success: true,
      blogs: filteredBlogs
    });

  } catch (error) {
    console.error('Error in category_blogs route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});



/*  FTP API(s)  */
router.use('/ftp', ftpApi);




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
