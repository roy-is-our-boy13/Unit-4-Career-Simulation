# Block 37A: Unit 4 Career Simulation (Core)

### Project Details

#### For a User Who is Not Logged In:

You will still have access to the website, where you can browse items and read their reviews. You can search for an item, but you won’t be able to leave comments or reviews unless you are logged in as an existing user. If you are not currently an existing user, you have the option to create an account by signing up. This will register you as a new user. If you are already an existing user, you simply need to log back into your account using your existing username and password.

#### For a Logged In User:

You can still search for items and view their reviews and comments. However, you now have the option to write your review and rating for each item. You can also modify or delete any comments or reviews that you have made. However, you cannot change or delete reviews or ratings made by other users; you can only edit or remove your own.

### REQUIRED ROUTES:


POST /api/auth/register

POST /api/auth/login

GET /api/auth/me 🔒

GET /api/items

GET /api/items/:id

GET /api/items/:id/reviews

GET /api/items/:itemId/reviews/:id

POST /api/items/:id/reviews 🔒

GET /api/reviews/me 🔒

PUT /api/users/:userId/reviews/:id 🔒

POST /api/items/:itemId/reviews/:id/comments 🔒

GET /api/comments/me 🔒

PUT /api/users/:userId/comments/:id 🔒

DELETE /api/users/:userId/comments/:id 🔒

DELETE /api/users/:userId/reviews/:id 🔒