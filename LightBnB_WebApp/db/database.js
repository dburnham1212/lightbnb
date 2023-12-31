const properties = require("./json/properties.json");
const users = require("./json/users.json");

const pool = require("./index");

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return pool
    .query(
      `SELECT *
      FROM users
      WHERE email = $1;`,
      [email.toLowerCase()]
    )
    .then((result) => {
        return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return pool
  .query(
    `SELECT *
    FROM users
    WHERE id = $1;`,
    [id])
  .then((result) => {
    return result.rows[0];
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return pool
  .query(
    `INSERT INTO users (
    name, email, password) 
    VALUES (
    $1, $2, $3);`,
    [user.name, user.email, user.password])
  .then((result) => {
    console.log('User added');
  })
  .catch((err) => {
    console.log(err.message);
  });
};

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */

const getAllReservations = function (guest_id, limit = 10) {
  return pool
    .query(
      `SELECT properties.*
      FROM reservations
      JOIN properties ON reservations.property_id = properties.id
      JOIN property_reviews ON properties.id = property_reviews.property_id
      WHERE reservations.guest_id = $1
      GROUP BY properties.id, reservations.id
      ORDER BY reservations.start_date
      LIMIT 10;`,
      [guest_id])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }
  if(options.owner_id){
    queryParams.push(options.owner_id);
    if(queryParams.length === 1){
      queryString += `WHERE owner_id = $${queryParams.length} `;
    } else {
      queryString += `AND owner_id = $${queryParams.length} `;
    }
  }
  if(options.minimum_price_per_night){
    queryParams.push(options.minimum_price_per_night);
    if(queryParams.length === 1){
      queryString += `WHERE cost_per_night > $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night > $${queryParams.length} `;
    }
  }
  if(options.maximum_price_per_night){
    queryParams.push(options.maximum_price_per_night);
    if(queryParams.length === 1){
      queryString += `WHERE cost_per_night < $${queryParams.length} `;
    } else {
      queryString += `AND cost_per_night < $${queryParams.length} `;
    }
  }

  queryString += `
  GROUP BY properties.id `;

  if(options.minimum_rating){
    queryParams.push(options.minimum_rating);
    queryString += `
    HAVING avg(property_reviews.rating) > $${queryParams.length} `;
  }
  // 4
  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  console.log(queryString);

  // 6
  return pool.query(queryString, queryParams).then((res) => res.rows);
};

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  let queryParams = [];

  
  let insertIdString = ``;
  let instertParamString = ``;
  for(let i = 0; i < Object.keys(property).length; i++) {
    insertIdString += `${Object.keys(property)[i]}`;
    if(i !== Object.keys(property).length - 1){
      insertIdString += `, `;
    }
    instertParamString += `$${i + 1}`;
    if(i !== Object.keys(property).length - 1){
      instertParamString += `, `;
    }
    queryParams.push(property[Object.keys(property)[i]]);
  }
  let queryString = `INSERT INTO properties (${insertIdString}) VALUES (${instertParamString}) RETURNING *`
   return pool
  .query(queryString, queryParams)
  .then((result) => {
    return result.rows;
  })
  .catch((err) => {
    console.log(err.message);
  });
};

module.exports = {
  getUserWithEmail,
  getUserWithId,
  addUser,
  getAllReservations,
  getAllProperties,
  addProperty,
};
