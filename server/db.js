const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL || "postgres://royperlman:7026@localhost/review_db");
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const JWT = (process.env.JWT || 'JesusStillLives');

console.log(process.env.DATABASE_URL);
require('dotenv').config();

/**
 * A method for creating a database table using SQL. 
 */
const createTables = async() => 
{
    try
    {
        /**
         *      The SQL database code, 
         *      based on the Schema Diagram.
         */
        const SQL = `
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS items;
            DROP TABLE IF EXISTS comments;
            DROP TABLE IF EXISTS reviews;
           
            CREATE TABLE users(
                id UUID PRIMARY KEY,
                username VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            );

            CREATE TABLE items(
                id UUID PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                category VARCHAR(255)
            );

            CREATE TABLE comments(
                id UUID PRIMARY KEY,
                comment_text TEXT,
                user_id UUID REFERENCES users(id),
                item_id UUID REFERENCES items(id),
                review_id UUID REFERENCES reviews(id)
            );

            CREATE TABLE reviews(
                id UUID PRIMARY KEY,
                rating INTEGER,
                review_text TEXT,
                user_id UUID REFERENCES users(id),
                item_id UUID REFERENCES items(id),
                CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
            ); 
        `;

        await client.query(SQL);
        console.log('Tables created successfully!');
    }
    catch(error)
    {
        console.error('Error creating tables:', error);
    }
};

/**
 * This method will be used to retrieve data on existing users.
 * @returns rows
 */
const fetchUsers = async() => 
{
    try 
    {
        const query = `
                    
            SELECT * 
            FROM users
        `;

        const { rows } = await client.query(query);

        return rows;
    } 
    catch(error) 
    {
        throw new Error('Error fetching users');
    }
};

/**
 * This method is used to create a new user after registration. 
 * @param {*} username
 * @param {*} password
 * @returns response.rows[0]
 */
const createNewUser = async({ username, password })=> 
{
    const SQL = `

            INSERT INTO users(id, username, password) 
            VALUES($1, $2, $3) 
            RETURNING *;
        `;
    const response = await client.query(SQL, [uuid.v4(), username, await bcrypt.hash(password, 5)]);
    return response.rows[0];
};

/**
 * This method is used to create a new item, also known as a product. 
 * @param {*} name
 * @param {*} description
 * @param {*} category
 * @returns response.rows[0]
 */
const createNewItems = async({ name, description, category }) => 
{
    const SQL = `
            
            INSERT INTO items (id, name, description, category) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;

    const response = await client.query(SQL, [uuid.v4(), name, description, category]);
    return response.rows[0];
};

/**
 * This method creates a new review and rating for an item by the user. 
 * @param {*} userId
 * @param {*} itemId
 * @param {*} rating
 * @param {*} reviewText
 * @returns response.rows[0]
 */
const createNewReview = async({ userId, itemId, rating, reviewText }) => 
{
    const SQL = `
            
            INSERT INTO reviews (id, user_id, item_id, rating, review_text)
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *;
        `;

    const response = await client.query(SQL, [uuid.v4(), userId, itemId, rating, reviewText]);

    return response.rows[0];
};

/**
 * This method retrieves data on existing items.
 * @returns response.rows
 */
const fetchItems = async() => 
{
    const SQL = `
            
            SELECT * 
            FROM items;
        `;

    const response = await client.query(SQL);
    return response.rows;
};

/**
 * This method retrieves data for existing items based on a selected ID.
 * @param {*} itemId 
 * @returns response.rows[0]
 */
const fetchItemDetails = async(itemId) => 
{
    const SQL = `
            
            SELECT * 
            FROM items 
            WHERE id = $1;
        `;

    const response = await client.query(SQL, [itemId]);
    return response.rows[0];
};

/**
 * This method retrieves reviews of each item made by existing users. 
 * @param {*} itemId 
 * @returns response.rows
 */
const fetchReviewsByItem = async(itemId) => 
{
    const SQL = `
                
            SELECT r.*, u.username 
            FROM reviews r 
            JOIN users u 
            ON r.user_id = u.id 
            WHERE item_id = $1;
        `;

    const response = await client.query(SQL, [itemId]);
    return response.rows;
};

/**
 *  This method retrieves a single review. 
 * @param {*} reviewId 
 * @returns response.rows[0]
 */
const fetchReview = async(reviewId) => 
{
    const SQL = `
    
            SELECT * 
            FROM reviews 
            WHERE id = $1;
        `;

    const response = await client.query(SQL, [reviewId]);
    return response.rows[0];
};

/**
 * This method retrieves a single review written by a user.
 * @param {*} userId 
 * @returns response.rows
 */
const fetchUsersReviews = async(userId) => 
{
    const SQL = `
    
            SELECT * 
            FROM reviews 
            WHERE user_id = $1;
        `;

    const response = await client.query(SQL, [userId]);
    return response.rows;
};

/**
 * This method updates reviews that already exist. 
 * @param {*} reviewId
 * @param {*} userId
 * @param {*} rating
 * @param {*} reviewText
 * @returns response.rows[0]
 */
const updateReview = async({ reviewId, userId, rating, reviewText }) => 
{
    const SQL = `
                
            UPDATE reviews 
            SET rating = $1, review_text = $2 
            WHERE id = $3 AND user_id = $4 
            RETURNING *;
        `;

    const response = await client.query(SQL, [rating, reviewText, reviewId, userId]);
    return response.rows[0];
};

/**
 * This method deletes a review submitted by an existing user. 
 * @param {*} reviewId
 * @param {*} userId
 */
const deleteReview = async({ reviewId, userId }) => 
{
    const SQL = `

            DELETE FROM reviews 
            WHERE id = $1 AND user_id = $2;
        `;

    await client.query(SQL, [reviewId, userId]);
};

/**
 * This method enables the user to create a new comment.
 * @param {*} reviewId
 * @param {*} userId
 * @param {*} commentText
 * @returns response.rows[0]
 */
const createNewComment = async({ reviewId, userId, commentText }) => 
{
    const SQL = `
            
            INSERT INTO comments (id, review_id, user_id, comment_text) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;

    const response = await client.query(SQL, [uuid.v4(), reviewId, userId, commentText]);
    return response.rows[0];
};

/**
 * This method retrieves data on comments made by a user based on their ID.
 * @param {*} userId 
 * @returns response.rows
 */
const fetchUsersComments = async(userId) => 
{
    const SQL = `
            
            SELECT * 
            FROM comments 
            WHERE user_id = $1;
        `;

    const response = await client.query(SQL, [userId]);
    return response.rows;
};

/**
 * This method allows the user to make updates to each comment. 
 * @param {*} commentId
 * @param {*} userId
 * @param {*} commentText
 * @returns response.rows[0]
 */
const modifyComment = async({ commentId, userId, commentText }) => 
{
    const SQL = `
    
        UPDATE comments 
        SET comment_text = $1 
        WHERE id = $2 AND user_id = $3 
        RETURNING *;
    `;

    const response = await client.query(SQL, [commentText, commentId, userId]);
    return response.rows[0];
};

/**
 * This method allows the user to delete their comments. 
 * @param {*} commentId
 * @param {*} userId
 */
const removeComment = async ({ commentId, userId }) => 
{
    const SQL = `

        DELETE FROM comments 
        WHERE id = $1 AND user_id = $2;
    `;

    await client.query(SQL, [commentId, userId]);
};

/**
 * This method make an autentication IF username exsits AND password is correct. 
 * @param {*} username
 * @param {*} password
 * @returns token
 */
const authenticate = async({ username, password })=> 
{
    const SQL = `

        SELECT id, username, password 
        FROM users 
        WHERE username=$1;
    `;

    const response = await client.query(SQL, [username]);
  
    if(!response.rows.length || (await bcrypt.compare(password, response.rows[0].password)) === false)
    {
        const error = Error('not authorized');
        error.status = 401;
        throw error;
    }
  
    const token = await jwt.sign({ id: response.rows[0].id}, JWT);
    console.log(token);

    return { token };
};
/**
 * This method searches for the correct user using their unique token. 
 * @param {*} token 
 * @returns response.rows[0]
 */
const findUserWithToken = async (token) => 
{
    try 
    {
        const payload = jwt.verify(token, JWT);
        const SQL = `

            SELECT id, username 
            FROM users 
            WHERE id = $1;
        `;
        
        const response = await client.query(SQL, [payload.id]);
        
        if (!response.rows.length) 
        {
            throw Error('not authorized');
        }
        return response.rows[0];
    } 
    catch (ex) 
    {
        const error = Error('not authorized');
        error.status = 401;
        throw error;
    }
};

module.exports = 
{
    client,
    createTables,
    createNewUser,
    createNewItems,
    createNewReview,
    fetchItems,
    fetchItemDetails,
    fetchReviewsByItem,
    fetchReview,
    fetchUsersReviews,
    updateReview,
    deleteReview,
    createNewComment,
    fetchUsersComments,
    modifyComment,
    removeComment,
    authenticate,
    fetchUsers,
    findUserWithToken  
}