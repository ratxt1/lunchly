/** Reservation for Lunchly */

const moment = require("moment");

const db = require("../db");


/** A reservation for a party */
class Reservation {
  constructor({id, customerId, numGuests, startAt, notes}) {
    this.id = id;
    this.customerId = customerId;
    this.numGuests = numGuests;
    this.startAt = startAt;
    this.notes = notes;
  }
  
  /** formatter for startAt */

  getformattedStartAt() {
    return moment(this.startAt).format('MMMM Do YYYY, h:mm a');
  }

  /** getters and setters  */

  get date() {
    debugger
    return this.year + "-" + this.month + "-" + this.day
  }

  get year() {
    return this.startAt.getFullYear()
  }

  get month() {
    let month = '' + (this.startAt.getMonth() + 1)
    if (month.length < 2) month = '0' + month;
    return month
  }

  get day() {
    let day = '' + this.startAt.getDate()
    if (day.length < 2) day = '0' + day;
    return day
  }

  get time() {
    let hours = '' + this.startAt.getHours()
    if (hours.length < 2) hours = '0' + hours;

    let minutes = '' + this.startAt.getMinutes()
    if (minutes.length < 2) minutes = '0' + minutes;
    return hours + ":" + minutes
  }

  set startAt(date) {
    
    if (!date instanceof Date) {
      throw new Error("Date must be a date object")
    }
    this._startAt = date
  }

  get startAt() {
    return this._startAt
  }
  
  /** prevent customer id is reassigned*/
  
  set customerId(val){
    if(this.customerId !== undefined){
      throw new Error("Can't reassign customer ID")
    }
    this._customerId = val
  }

  get customerId() {
    return this._customerId
  }
  /**validate number of guest and throw error if value is less than 1 */

  set numGuests(num) {
    if(num < 1){
      throw new Error("Guest have to be at least one")
    }
    this._numGuests = num
  }

  get numGuests() {
    return this._numGuests
  }

  /** given a customer id, find their reservations. */

  static async getReservationsForCustomer(customerId) {
    const results = await db.query(
          `SELECT id, 
           customer_id AS "customerId", 
           num_guests AS "numGuests", 
           start_at AS "startAt", 
           notes AS "notes"
         FROM reservations 
         WHERE customer_id = $1`,
        [customerId]
    );

    return results.rows.map(row => new Reservation(row));
  }

  static async getMostRecentReservationForCustomer(customerId) {
    const result = await db.query(
      `SELECT id, 
        customer_id AS "customerId", 
        num_guests AS "numGuests", 
        start_at AS "startAt", 
        notes AS "notes"
      FROM reservations
      WHERE customer_id = $1
      ORDER BY start_at DESC
      LIMIT 1;
      `,
      [customerId]
    )


    const reservation = result.rows[0];

    if (reservation === undefined) {
      return null;
    }
    return new Reservation(reservation);
  }

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
        customer_id AS "customerId", 
        num_guests AS "numGuests", 
        start_at AS "startAt", 
        notes AS "notes" 
      FROM reservations WHERE id = $1`,
      [id]
    );

    const reservation = results.rows[0];

    if (reservation === undefined) {
      const err = new Error(`No such reservation: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Reservation(reservation);
  }
  
  /** save this reservation. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO reservations (customer_id, num_guests, start_at, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.customerId, this.numGuests, this.startAt, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE reservations SET customer_id=$1, num_guests=$2, start_at=$3, notes=$4
             WHERE id=$5`,
        [this.customerId, this.numGuests, this.startAt, this.notes, this.id]
      );
    }
  }
}


module.exports = Reservation;
