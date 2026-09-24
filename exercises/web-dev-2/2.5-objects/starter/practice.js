// ======================================================
// JavaScript Practice: Objects
// ======================================================
//
// Each problem below explains what your object code should do.
// Try writing the code where it says "your code here".
// Use console.log() to check your answers.
// ======================================================


// 1. Create an Object
// Create an object called "car" with properties: brand, model, and year.
// Return that object
// Example: { brand: "Toyota", model: "Camry", year: 2020 }
function createCar() {
    // your code here
}


// 2. Access a Property
// Given the "car" object, print just the model.
// Expected Output: Camry (if car.model = "Camry")
function getCarModel(car) {
    // your code here
}


// 3. Update a Property
// Change the year of the "car" object to 2023.
// Example: { brand: "Toyota", model: "Camry", year: 2023 }
function updateCarYear(car) {
    // your code here
}


// 4. Add a New Property
// Add a property "color" to the "car" object with any value.
// Example: { brand: "Toyota", model: "Camry", year: 2023, color: "red" }
function addCarColor(car) {
    // your code here
}


// 5. Delete a Property
// Remove the "model" property from the "car" object.
function deleteCarModel(car) {
    // your code here
}


// 6. Loop Through Properties
// Write a function that prints all keys and values from the "car" object.
// Example: brand Toyota, model Camry, year 2023
function printCarProperties(car) {
    // your code here
}


// 7. Check if Property Exists
// Write a function that checks if "brand" exists in the car object.
// Expected Output: true (if it exists), false (if not)
function hasBrand(car) {
    // your code here
}


// 8. Nested Objects
// Create an object "student" with a nested "grades" object.
// Example: { name: "Alice", grades: { math: 95, english: 88 } }
// Then print the student's math grade.
function createStudent() {
    // your code here
}


// 9. Object with a Method
// Create an object "dog" with a name and a method "bark" that prints "Woof!".
// Example: dog.bark() ➔ "Woof!"
function createDog() {
    // your code here
}


// 10. Object Methods: keys, values, entries
// Use Object.keys, Object.values, and Object.entries on the car object
// and print the results.
function exploreCarObject(car) {
    // your code here

}

module.exports = {
  createCar,
  getCarModel,
  updateCarYear,
  addCarColor,
  deleteCarModel,
  printCarProperties,
  hasBrand,
  createStudent,
  createDog,
  exploreCarObject
};
