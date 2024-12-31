const 
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
    updateComment,
    deleteComment,
    authenticate,
    fetchUsers,
    findUserWithToken
} 
= require('./db');

const express = require('express');
const app = express();
app.use(express.json());

/**
 * This method is used to ensure that the user remains logged in.
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const isLoggedIn = async (req, res, next)=> 
{
    try 
    {
        req.user = await findUserWithToken(req.headers.authorization);
        next();
    }
    catch(ex)
    {
        next(ex);
    }
};

/**
 * Placeholders 
 */

// POST/api/items
app.post('/api/items', isLoggedIn, async (req, res) => 
{
    try 
    {
        const anItem = await createNewItems(req.body);
        res.status(201).send(anItem);
    } 
    catch (ex) 
    {
        res.status(500).send({ error: ex.message });
    }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => 
{
    try 
    {
        const user = await createNewUser(req.body);
        res.status(201).send(user);
    } 
    catch (ex) 
    {
        res.status(500).send({ error: ex.message });
    }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => 
{
    try 
    {
        const token = await authenticate(req.body);
        res.send(token);
    } 
    catch (ex) 
    {

        res.status(401).send({ error: 'Login failed', ex });
    }
});

// GET /api/auth/me 
app.get('/api/auth/me', isLoggedIn, async(req, res) => 
{
    try 
    {
        res.send(req.user);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve user information.', ex });
        next(ex);
    }
});

// GET /api/items
app.get('/api/items', async(req, res) => 
{
    try 
    {
        const items = await fetchItems();
        res.send(items);
    } 
    catch (ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve items.', ex });
    }
});

// GET /api/items/:id
app.get('/api/items/:id', async(req, res) => 
{
    try 
    {
        const item = await fetchItemDetails(req.params.id);
        res.send(item);
    } 
    catch (ex) 
    {
        res.status(404).send({ error: 'The item could not be located.', ex });
    }
});

// GET /api/items/:id/reviews
app.get('/api/items/:id/reviews', async(req, res) => 
{
    try 
    {
        const reviews = await fetchReviewsByItem(req.params.id);
        res.send(reviews);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve reviews.' , ex});
    }
});

// GET /api/items/:itemId/reviews/:id
app.get('/api/reviews/:reviewId', async(req, res) => 
{
    try 
    {
        const review = await fetchReview(req.params.reviewId);
    
        if (!review) 
        {
            res.status(404).send({ error: 'No reviews are available.', ex });
        } 
        else 
        {
            res.send(review);
        }
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve the review.', ex });
    }
});

// POST /api/items/:id/reviews 
app.post('/api/items/:id/reviews', isLoggedIn, async(req, res) => 
{
    try 
    {
        const createdReview = await createNewReview(
        {
            userId: req.user.id,
            itemId: req.params.id,
            rating: req.body.rating,
            reviewText: req.body.reviewText
        });
        res.status(201).send(createdReview);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to create the review.', ex });
    }
});

// GET /api/reviews/me 
app.get('/api/reviews/me', isLoggedIn, async(req, res) => 
{
    try 
    {
        const reviews = await fetchUsersReviews(req.user.id);
        res.send(reviews);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve reviews.', ex });
    }
});

// PUT /api/users/:userId/reviews/:id 
app.put('/api/reviews/:id', isLoggedIn, async(req, res) => 
{
    try 
    {
        const updatedReview = await updateReview(
        {
            reviewId: req.params.id,
            userId: req.user.id,
            rating: req.body.rating,
            reviewText: req.body.reviewText
        });

        res.send(updatedReview);
    } 
    catch(ex)
    {
        res.status(500).send({ error: 'Unable to update the review.', ex });
    }
});

// POST /api/users/:userId/comments/:id 
app.post('/api/items/:id/reviews/:reviewId/comments', isLoggedIn, async(req, res) => 
{
    try 
    {
        const comment = await createNewComment(
        {
            reviewId: req.params.reviewId,
            userId: req.user.id,
            commentText: req.body.commentText
        });
            res.status(201).send(comment);
    }
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to create the comment.', ex });
    }
});

// DELETE /api/users/:userId/reviews/:id 
app.delete('/api/reviews/:id', isLoggedIn, async (req, res) => 
{
    try 
    {
        await deleteReview({ reviewId: req.params.id, userId: req.user.id });
        res.sendStatus(204);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to delete the review.' , ex});
    }
});

// PUT /api/users/:userId/comments/:id 
app.get('/api/comments/me', isLoggedIn, async (req, res) => 
{
    try 
    {
        const comments = await fetchUsersComments(req.user.id);
        res.send(comments);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to retrieve the comments.' , ex});
    }
});

// PUT api/comments/:id 
app.put('/api/comments/:id', isLoggedIn, async (req, res) => 
{
    try 
    {
        const updated = await updateComment(
        {
            commentId: req.params.id,
            userId: req.user.id,
            commentText: req.body.commentText
        });
        res.send(updated);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'Unable to update the comment.', ex });
    }
});
// DELETE /api/comments/:id
app.delete('/api/comments/:id', isLoggedIn, async (req, res) => 
{
    try 
    {
        await deleteComment({ commentId: req.params.id, userId: req.user.id });
        res.sendStatus(204);
    } 
    catch(ex) 
    {
        res.status(500).send({ error: 'The comment could not be deleted.', ex });
    }
});

app.use((err, req, res, next) => 
{
    console.error(err);
    res.status(err.status || 500).send({ error: err.message || 'Internal Server ERROR.' });
});


const init = async () => 
{
    try
    {
        const portNumber = 3000;
        const port = (process.env.PORT || portNumber);
        await client.connect();
        console.log('connected to database');
    
        await createTables();
        console.log('tables created');

        const 
        [
            PeterParker, 
            TonyStark,
            SteveRogers,
            BruceBanner,
            ClintBarton,
            Thor,
            JesusChrist,
            LEGOs,
            Bionicles,
            Transformers,
            GIJoe,
            BlokBots,
            MarvelLegends

        ]
        = await Promise.all(
        [
            createNewUser({username: 'PeterParker', password: 'spiderman74'}),
            createNewUser({username: 'TonyStark', password: '32ironm8n'}),
            createNewUser({username: 'SteveRogers', password: 'c8pt8in8meric*'}),
            createNewUser({username: 'BruceBanner', password: 'hu1k'}),
            createNewUser({username: 'ClintBarton', password: 'h8wk3y3'}),
            createNewUser({username: 'Thor', password: 'hammer_time143'}),
            createNewUser({username: 'JesusChrist', password: 'theMessiah_AND_SonOfGod'}),
            createNewItems({ name: 'LEGOs', description: 'Bricks for building sets.', category: 'Toys' }),
            createNewItems({ name: 'Bionicles', description: 'Connecting Joints.', category: 'Toys' }),
            createNewItems({ name: 'Transformers', description: 'Robots in Disguise.', category: 'Toys' }),
            createNewItems({ name: 'GIJoe', description: 'Toy Soliders vs Gobra.', category: 'Toys'}),
            createNewItems({ name: 'BlokBots', description: 'Robots in War.', category: 'Toys' }),
            createNewItems({ name: 'MarvelLegends', description: 'Actions figures based on characters from Marvel Comics.', category: 'Toys' })
        ]);

        console.log("Both Users and Items are created.");
        console.log(await fetchUsers());

        app.listen(port, ()=> console.log(`listening on port ${port}`));
    }
    catch(ex)
    {
        console.log(ex);
    }
};

init ();