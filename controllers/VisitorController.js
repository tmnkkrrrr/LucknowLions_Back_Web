const express = require("express");
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const pool = require("../database/connect");
const { sendForgetPassOtp, sendWelcome, sendWelcomeEmail } = require("../functions");
const { readAndParseJson } = require("../config/readParsedData");
const generatePassword = require("../utilities/utilities");


const categoryFilePath = path.join(__dirname, '../db_files/categories.json');
const blogsFilePath = path.join(__dirname, '../db_files/blogs.json');

function readCategories() {
  const data = fs.readFileSync(categoryFilePath, 'utf8');
  return JSON.parse(data);
}

function readBlogs() {
  const data = fs.readFileSync(blogsFilePath, 'utf8');
  return JSON.parse(data);
}


//API to get Blogs Data (Next.js)
router.get('/blogData/:cat/:pageUrl', async (req, res) => {
  try {

    const { cat, pageUrl } = req.params;
    const catData = readCategories();
    const blogsData = readBlogs();

    const category = catData.find(c => c.slug === cat);
    console.log(category)
    if (!category) {
      return res.status(404).json({ error: 'Category not found' })
    };

    // Find the blog that matches the pageUrl and is not hidden
    const blog = Array.isArray(blogsData)
      ? blogsData.find(blog =>
        blog.pageUrl === pageUrl && !blog.isHidden &&
        blog.selectedCategories.includes(category.id)
      )
      : null;

    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Error reading or processing blogs data' });
  }
});


router.get('/categories', async (req, res) => {
  try {

    const categories = readCategories();

    res.status(200).json({
      success: true,
      blogs: categories
    });

  } catch (error) {
    console.error('Error in category route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});


router.get('/blogs_with_url', async (req, res) => {
  try {
    // Read blogs
    const blogs = readBlogs();
    const catData = readCategories();

    const categoryMap = {};
    catData.forEach(category => { categoryMap[category.id] = category.slug; });

    const blogList = blogs.map(blog => {
      // Get the category slug for the first selected category (assuming there could be multiple)
      const categoryId = blog.selectedCategories[0];
      const categorySlug = categoryMap[categoryId] || 'uncategorized';

      // Construct the URL using category/pageUrl format
      const blogUrl = `${categorySlug}/${blog.pageUrl}`;

      return {
        title: blog.title,
        url: blogUrl
      };
    });
    res.json(blogList);
    return;
    const filteredABlogsData = blogs.map(({ title, pageUrl }) => ({ title, pageUrl }));

    return res.status(200).json({
      success: true,
      blogsdata: filteredABlogsData
    });

  } catch (error) {
    console.error('Error in category_blogs route:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});




router.post('/signup', async (req, res) => {
  console.table(req.body);
  try {
    if (!req.body.name || !req.body.email || !req.body.mobileNo) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { name, email, mobileNo } = req.body;

    const checkEmail = await pool.execute(
      `SELECT count(*) AS count FROM users WHERE email = ?`, [email]);
    console.log(checkEmail[0][0].count);
    if (checkEmail[0][0].count > 0) {
      res.status(201).send("Email Already Exist");
      return;
    }

    const checkMobileNo = await pool.execute(
      `SELECT count(*) AS count FROM users WHERE mobileNo = ?`, [mobileNo]);
    if (checkMobileNo[0][0].count > 0) {
      res.status(201).send("Mobile Number Already Exist");
      return;
    }

    const password = generatePassword();

    const insertLogin = await pool.execute(
      "INSERT INTO users(name, email, mobileNo, password) VALUES(?, ?, ?, ?)", [name, email, mobileNo, password]);
    const insertId = insertLogin[0].insertId;

    const client = "LKO" + (10100 + insertId);
    await pool.execute(
      "UPDATE users SET clientID = ? WHERE userId = ?", [client, insertId]);
    if (insertLogin[0].insertId) {
      sendWelcome(client, name, mobileNo, password);
      console.log(11);
      sendWelcomeEmail(email, name, client, password);
      res.status(200).send({ msg: 'success', userId: insertId });
      return;
    }

    res.status(400).send("Could not Register !!!");
    return;
  }
  catch (e) {
    console.log(e);
  }
});

router.get('/blogs/related', async (req, res) => {
  try {
    const { category: categoryName } = req.query;


    // Read categories and blogs
    const categories = readCategories();
    const blogs = readBlogs();

    // Find category ID by name
    const category = categories.find(cat =>
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );


    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Filter blogs by category ID
    const filteredBlogs = blogs.filter(blog => {
      return blog.selectedCategories &&
        Array.isArray(blog.selectedCategories) &&
        blog.selectedCategories.includes(category.id);
    });

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




router.post('/check_email', async (req, res) => {
  console.table(req.body);
  try {
    if (!req.body.email) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { email } = req.body;

    const checkMobileNo = await pool.execute(
      `SELECT count(*) AS count FROM users WHERE email = ?`, [email]);
    if (checkMobileNo[0][0].count > 0) {
      console.log(4)
      res.status(200).send("Mobile Number Already Exist");
      return;
    }
    else {
      res.status(201).send("Mobile does not Exist");
      return;
    }
  }
  catch (e) {
    console.log(e);
  }
});

router.post('/check_mob', async (req, res) => {
  console.table(req.body);
  try {
    if (!req.body.mob) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { mob } = req.body;

    const checkMobileNo = await pool.execute(
      `SELECT count(*) AS count FROM users WHERE mobileNo = ?`, [mob]);
    if (checkMobileNo[0][0].count > 0) {
      console.log(4)
      res.status(200).send("Mobile Number Already Exist");
      return;
    }
    else {
      console.log(5)

      res.status(201).send("Mobile does not Exist");
      return;
    }
  }
  catch (e) {
    console.log(e);
  }
});

router.post('/check_refer', async (req, res) => {
  console.table(req.body);
  try {
    if (!req.body.code) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { code } = req.body;

    const checkReferCode = await pool.execute(
      `SELECT count(*) AS count FROM users WHERE clientID = ?`, [code]);
    console.log(checkReferCode[0][0].count)
    if (checkReferCode[0][0].count > 0) {
      res.status(200).send("Refer Code Exist");
      return;
    }
    else {
      res.status(201).send("Refer Code doesnot Exist");
      return;
    }
  }
  catch (e) {
    console.log(e);
  }
});



router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    if (req.body.email && req.body.password) {
      const findUser = await pool.execute(
        "SELECT userId, clientID, name, email, mobileNo FROM users WHERE (email=? OR clientID=? OR mobileNo=?) AND password = ? AND isActive = 1", [email, email, email, password]);
      if (findUser[0].length > 0) {
        console.log(findUser[0][0]);
        const userId = findUser[0][0].userId;
        const name = findUser[0][0].name;
        const clientID = findUser[0][0].clientID;
        const email = findUser[0][0].email;
        const mobile = findUser[0][0].mobileNo;
        const token = jwt.sign({ userId, name }, process.env.Tutor_key, { expiresIn: '7d' });

        res.status(200).json({ token, msg: true, userId: userId, clientID: clientID, name: name, email: email, mobileNo: mobile });
        return;
      }

      res.status(401).send("Could not Login1 !!!");
      return;
    } else if (req.body.mobileNo && req.body.password) {

      const checkLogin = await pool.execute(
        "SELECT count(*) AS count FROM users WHERE mobileNo = ? AND password = ?", [mobileNo, password]);
      if (checkLogin[0][0].count > 0) {
        res.status(200).send("Authenticated");
        return;
      }

      res.status(402).send("Could not Login2 !!!");
      return;
    } else {
      res.status(403).send("Fill All Details in Request!");
      return;
    }
  }
  catch (e) {
    console.log(e);
  }
});


router.post('/admin_login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (username && password) {

      if (username === 'admin' && password === 'MySecoundBike') {
        res.status(200).json({ 'message': 'success', 'token': jwt.sign({ username }, process.env.ADMIN_KEY, { expiresIn: '7d' }) });
        return;
      } else {
        res.status(401).send("Invalid Credentials !!!");
      }

    } else {
      res.status(401).send("Could not Login !!!");
      return;
    }
  }
  catch (e) {
    console.log(e);
  }
});






router.post('/change_user_state', async (req, res) => {
  console.table(req.body);
  try {
    if (!(req.body.clientID)) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { clientID, activate } = req.body;

    const changeState = await pool.execute(
      `UPDATE users SET isActive = ? WHERE clientID = ?`, [activate, clientID]);
    console.log(changeState[0]);
    if (changeState[0].affectedRows > 0) {
      res.status(200).send({ msg: 'success' });
      return;
    }
    res.status(201).send({ msg: 'NOT Found!' });
  }
  catch (e) {
    console.log(e);
  }
});


router.post('/forget_pass', async (req, res) => {
  console.table(req.body);
  try {
    if (!(req.body.email)) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { email } = req.body;

    const [checkEmail] = await pool.execute(
      `SELECT name, mobileNo FROM users WHERE email = ?`, [email]);

    if (!checkEmail.length) {
      console.log(5)
      res.status(400).send({ msg: 'Retry' });
      return;
    }

    if (checkEmail[0].mobileNo && checkEmail[0].name) {
      let otp = await sendForgetPassOtp(checkEmail[0].name, checkEmail[0].mobileNo);
      res.status(200).send({ msg: 'success', mobile: checkEmail[0].mobileNo, otp: otp });
      return;
    }

    res.status(400).send({ msg: 'NOT Found!' });
  }
  catch (e) {
    console.log(e);
  }
});



router.post('/check_inactive', async (req, res) => {
  console.table(req.body);
  try {
    if (!req.body.clientID) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { clientID } = req.body;

    const checkInactive = await pool.execute(
      `SELECT isActive FROM users WHERE clientID = ?`, [clientID]);
    if (checkInactive[0][0].isActive == 0) {
      res.status(200).end();
      return;
    }
    else {
      res.status(201).send({ msg: 'success' });
      return;
    }

  }
  catch (e) {
    console.log(e);
  }
});




router.get('/users_list', async (req, res) => {
  const findUsers = await pool.execute(
    "SELECT  clientID, name, email, mobileNo, password, address, state, city, isActive, createdAt FROM users");
  res.status(200).send(findUsers[0]);
  return;
});

router.post('/new_pass', async (req, res) => {
  console.table(req.body);
  try {
    if (!(req.body.email && req.body.pass)) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    const { email, pass } = req.body;

    const changePass = await pool.execute(
      `UPDATE users SET password = ? WHERE email = ?`, [pass, email]);
    console.log(changePass[0]);
    if (changePass[0].changedRows > 0) {
      res.status(200).send({ msg: 'success' });
      return;
    }
    res.status(400).send({ msg: 'NOT Found!' });
  }
  catch (e) {
    console.log(e);
  }
});





router.get('/getBrokerData/:brokerId', async (req, res) => {
  const brokerId = req.params.brokerId;
  try {
    // Fetch broker data
    const [brokerRows] = await pool.execute('SELECT * FROM brokers WHERE id = ?', [brokerId]);
    if (brokerRows.length === 0) {
      return res.status(404).send('Broker not found');
    }
    const broker = brokerRows[0];

    const [marginRows] = await pool.execute('SELECT * FROM margin WHERE broker_id = ?', [brokerId]);

    const [brokerageRows] = await pool.execute('SELECT * FROM brokerage WHERE broker_id = ?', [brokerId]);

    const [chargesRows] = await pool.execute('SELECT * FROM charges WHERE broker_id = ?', [brokerId]);

    res.status(200).json({
      broker,
      margin: marginRows,
      brokerage: brokerageRows,
      charges: chargesRows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/update_index/:id/:new', async (req, res) => {
  try {
    const id = req.params.id;
    const newId = req.params.new;
    if (!(id && newId)) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }

    const updateIndex = await pool.execute(
      "UPDATE brokers SET ind=? WHERE id=?", [newId, id]);
    if (updateIndex[0].affectedRows) {
      res.status(200).end();
    } else {
      res.status(202).end();
    }
  } catch (e) {
    res.status(500);
  }
});



const notStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'notif/');
  },
  filename: function (req, file, cb) {
    cb(null, 'temp.png');
  }
});
const notUpload = multer({ storage: notStorage });
router.post('/send-noti', notUpload.single('image'), async (req, res) => {
  try {
    if (!(req.body.title && req.body.body)) {
      res.status(400).send("Please Fill All Deatils !!!");
      return;
    }
    let { title, body, url } = req.body;
    if (url === undefined) url = '';
    const [insert] = await pool.execute("INSERT INTO notification(title, body, url) VALUES(?, ?, ?)", [title, body, url]);

    if (req.file && insert.insertId) {
      console.log(req.file);
      console.log(insert.insertId);
      const imgFile = req.file;
      const imgNewName = `${insert.insertId}.png`;
      fs.renameSync(path.join(imgFile.destination, 'temp.png'), path.join(imgFile.destination, imgNewName));
    }
    console.log(55)

    let result = await sendNotificationToAll(title, body, insert.insertId.toString(), url);
    if (result.success) {
      res.status(200).end();
      pool.execute(
        "UPDATE notification SET isSucceed = true WHERE notificationId=?", [insert.insertId]);
      return;
    }

  } catch (e) {
    res.status(200).send(e);
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const getNotifications = await pool.execute(`SELECT * FROM notification ORDER BY notificationId DESC`);
    res.send(getNotifications[0]);
    return;
  } catch (e) {
    res.status(500);
  }
});
router.get('/delete_notification/:id', async (req, res) => {
  try {
    const referId = req.params.id;
    const getRefers = await pool.execute(`DELETE FROM notification WHERE notificationId=?`, [referId]);
    res.status(200).send();
    return;
  } catch (e) {
    res.status(500);
  }
});


router.get('/refers', async (req, res) => {
  try {
    const getRefers = await pool.execute(`SELECT refer.referId, refer.fromClient AS fromID, refer.toClient AS toID, refer.amount, refer.paid, fromUser.name AS fromName, toUser.name AS toName, refer.createdAt AS dat FROM refer JOIN users AS fromUser ON refer.fromClient = fromUser.clientID JOIN users AS toUser ON refer.toClient = toUser.clientID ORDER BY refer.referId DESC`);
    res.send(getRefers[0]);
    return;
  } catch (e) {
    res.status(500);
  }
});

router.get('/pay_refer/:id', async (req, res) => {
  try {
    const getRefers = await pool.execute(`UPDATE refer SET paid=1 WHERE referId=?`, [req.params.id]);
    console.log(getRefers);
    res.status(200).send();
    return;
  } catch (e) {
    res.status(500);
  }
});

router.get('/wallet/:id', async (req, res) => {
  try {
    const client = req.params.id;
    const getWallet = await pool.execute(`SELECT refer.createdAt AS dat, refer.toClient AS clientId, toUser.name AS name, refer.amount, paid FROM refer JOIN users AS toUser ON refer.toClient = toUser.clientID WHERE refer.fromClient=? ORDER BY refer.referId DESC`, [client]);
    console.log(getWallet[0])
    res.send(getWallet[0]);
    return;
  } catch (e) {
    res.status(500);
  }
});

router.get('/refers_values', async (req, res) => {
  try {
    res.send(readAndParseJson('../config/refer.json'));
    return;
  } catch (e) {
    res.status(500);
  }
});



module.exports = router;
