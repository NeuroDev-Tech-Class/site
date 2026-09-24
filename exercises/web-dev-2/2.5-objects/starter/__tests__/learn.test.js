const objects = require('../practice');

// 1. createCar
test('createCar should return an object with brand, model, year', () => {
  const car = objects.createCar();
  expect(car).toHaveProperty('brand');
  expect(car).toHaveProperty('model');
  expect(car).toHaveProperty('year');
});
test('createCar should return a car object with brand as a string', () => {
  expect(typeof objects.createCar().brand).toBe('string');
});
test('createCar should return a car object with model as a string', () => {
  expect(typeof objects.createCar().model).toBe('string');
});
test('createCar should return a car object with year as a number', () => {
  expect(typeof objects.createCar().year).toBe('number');
});

// 2. getCarModel
test('getCarModel should return "Camry" when car.model = "Camry"', () => {
  expect(objects.getCarModel({ brand: "Toyota", model: "Camry", year: 2020 })).toEqual("Camry");
});
test('getCarModel should return "Civic" when car.model = "Civic"', () => {
  expect(objects.getCarModel({ brand: "Honda", model: "Civic", year: 2019 })).toEqual("Civic");
});
test('getCarModel should return undefined when model is missing', () => {
  expect(objects.getCarModel({ brand: "Ford", year: 2018 })).toEqual(undefined);
});
test('getCarModel should return correct model when multiple properties exist', () => {
  expect(objects.getCarModel({ brand: "Tesla", model: "Model 3", year: 2022, color: "black" })).toEqual("Model 3");
});

// 3. updateCarYear
test('updateCarYear should set year to 2023', () => {
  expect(objects.updateCarYear({ brand: "Toyota", model: "Camry", year: 2020 }).year).toEqual(2023);
});
test('updateCarYear should overwrite old year value', () => {
  expect(objects.updateCarYear({ brand: "Honda", model: "Civic", year: 2015 }).year).toEqual(2023);
});
test('updateCarYear should return the updated object', () => {
  const car = { brand: "Ford", model: "Focus", year: 2019 };
  expect(objects.updateCarYear(car)).toHaveProperty('year', 2023);
});
test('updateCarYear should not remove other properties', () => {
  const car = { brand: "Tesla", model: "Model S", year: 2021, color: "red" };
  expect(objects.updateCarYear(car).color).toEqual("red");
});

// 4. addCarColor
test('addCarColor should add a color property', () => {
  const car = objects.addCarColor({ brand: "Toyota", model: "Camry", year: 2020 });
  expect(car).toHaveProperty('color');
});
test('addCarColor should not remove existing properties', () => {
  const car = { brand: "Honda", model: "Civic", year: 2019 };
  expect(objects.addCarColor(car)).toHaveProperty('model', 'Civic');
});
test('addCarColor should overwrite existing color if already present', () => {
  const car = { brand: "Ford", model: "Focus", year: 2018, color: "blue" };
  expect(objects.addCarColor(car).color).not.toEqual("blue");
});
test('addCarColor should return an object', () => {
  expect(typeof objects.addCarColor({ brand: "Tesla", model: "Model 3", year: 2022 })).toBe("object");
});

// 5. deleteCarModel
test('deleteCarModel should remove the model property', () => {
  const car = objects.deleteCarModel({ brand: "Toyota", model: "Camry", year: 2020 });
  expect(car.model).toEqual(undefined);
});
test('deleteCarModel should keep other properties intact', () => {
  const car = objects.deleteCarModel({ brand: "Honda", model: "Civic", year: 2019 });
  expect(car).toHaveProperty('brand', 'Honda');
});
test('deleteCarModel should work even if model does not exist', () => {
  const car = objects.deleteCarModel({ brand: "Ford", year: 2018 });
  expect(car.model).toEqual(undefined);
});
test('deleteCarModel should return an object', () => {
  expect(typeof objects.deleteCarModel({ brand: "Tesla", model: "Model S", year: 2022 })).toBe("object");
});

// 6. printCarProperties
test('printCarProperties should return all key-value pairs for car', () => {
  expect(objects.printCarProperties({ brand: "Toyota", model: "Camry", year: 2020 }))
    .toEqual(["brand Toyota", "model Camry", "year 2020"]);
});
test('printCarProperties should return empty array for {}', () => {
  expect(objects.printCarProperties({})).toEqual([]);
});
test('printCarProperties should include additional properties', () => {
  const car = { brand: "Honda", model: "Civic", year: 2019, color: "red" };
  expect(objects.printCarProperties(car)).toContain("color red");
});
test('printCarProperties should return array of strings', () => {
  const result = objects.printCarProperties({ brand: "Tesla", model: "Model X", year: 2022 });
  expect(result.every(r => typeof r === "string")).toBe(true);
});

// 7. hasBrand
test('hasBrand should return true when brand exists', () => {
  expect(objects.hasBrand({ brand: "Toyota", model: "Camry" })).toEqual(true);
});
test('hasBrand should return false when brand does not exist', () => {
  expect(objects.hasBrand({ model: "Civic", year: 2019 })).toEqual(false);
});
test('hasBrand should return false for empty object', () => {
  expect(objects.hasBrand({})).toEqual(false);
});
test('hasBrand should return true when extra properties exist', () => {
  expect(objects.hasBrand({ brand: "Ford", model: "Focus", year: 2018, color: "blue" })).toEqual(true);
});

// 8. createStudent
test('createStudent should return an object with name and grades', () => {
  const student = objects.createStudent();
  expect(student).toHaveProperty('name');
  expect(student).toHaveProperty('grades');
});
test('createStudent should include a math grade', () => {
  expect(objects.createStudent().grades).toHaveProperty('math');
});
test('createStudent should include an english grade', () => {
  expect(objects.createStudent().grades).toHaveProperty('english');
});
test('createStudent should have math grade as a number', () => {
  expect(typeof objects.createStudent().grades.math).toBe('number');
});

// 9. createDog
test('createDog should return an object with name', () => {
  expect(objects.createDog()).toHaveProperty('name');
});
test('createDog should include a bark method', () => {
  expect(typeof objects.createDog().bark).toBe('function');
});
test('createDog.bark should return "Woof!"', () => {
  expect(objects.createDog().bark()).toEqual("Woof!");
});
test('createDog should return an object', () => {
  expect(typeof objects.createDog()).toBe('object');
});

// 10. exploreCarObject
test('exploreCarObject should return keys, values, and entries', () => {
  const car = { brand: "Toyota", model: "Camry", year: 2020 };
  const result = objects.exploreCarObject(car);
  expect(result).toHaveProperty('keys');
  expect(result).toHaveProperty('values');
  expect(result).toHaveProperty('entries');
});
test('exploreCarObject.keys should match object keys', () => {
  const car = { brand: "Honda", model: "Civic" };
  expect(objects.exploreCarObject(car).keys).toEqual(["brand", "model"]);
});
test('exploreCarObject.values should match object values', () => {
  const car = { brand: "Ford", year: 2018 };
  expect(objects.exploreCarObject(car).values).toEqual(["Ford", 2018]);
});
test('exploreCarObject.entries should match object entries', () => {
  const car = { brand: "Tesla", model: "Model 3" };
  expect(objects.exploreCarObject(car).entries).toEqual([["brand","Tesla"],["model","Model 3"]]);
});
